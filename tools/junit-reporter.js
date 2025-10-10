const fs = require('node:fs');
const path = require('node:path');

const escape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const templateValue = (template, variables) => {
  if (!template) {
    return '';
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key];
    }
    return '';
  });
};

class SimpleJunitReporter {
  constructor(globalConfig, options = {}) {
    this._globalConfig = globalConfig;
    this._options = {
      outputDirectory: 'reports',
      outputName: 'junit.xml',
      suiteName: 'jest tests',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ...options,
    };
  }

  onRunComplete(contexts, results) {
    const { outputDirectory, outputName, suiteName, classNameTemplate, titleTemplate } = this._options;
    const outputDir = path.resolve(results.projectConfig.rootDir, outputDirectory);
    fs.mkdirSync(outputDir, { recursive: true });

    const totalTime = results.testResults.reduce((acc, suite) => {
      if (suite.perfStats && typeof suite.perfStats.runtime === 'number') {
        return acc + suite.perfStats.runtime / 1000;
      }
      if (suite.perfStats && typeof suite.perfStats.end === 'number' && typeof suite.perfStats.start === 'number') {
        return acc + (suite.perfStats.end - suite.perfStats.start) / 1000;
      }
      return acc;
    }, 0);

    const suitesXml = results.testResults
      .map((suite) => {
        const suiteNameValue = suite.testFilePath ? path.relative(results.projectConfig.rootDir, suite.testFilePath) : suite.testFilePath;
        const tests = suite.testResults.length;
        const failures = suite.testResults.filter((test) => test.status === 'failed').length;
        const skipped = suite.testResults.filter((test) => test.status === 'pending' || test.status === 'skipped').length;
        const duration = suite.perfStats && typeof suite.perfStats.runtime === 'number'
          ? suite.perfStats.runtime / 1000
          : 0;

        const testCasesXml = suite.testResults
          .map((test) => {
            const classnameRaw = test.ancestorTitles.join(' › ');
            const classname = templateValue(classNameTemplate, {
              classname: classnameRaw || suiteNameValue || 'tests',
              filepath: suiteNameValue || '',
              title: test.title,
            }) || classnameRaw || suiteNameValue || 'tests';

            const title = templateValue(titleTemplate, {
              classname: classnameRaw || suiteNameValue || 'tests',
              filepath: suiteNameValue || '',
              title: test.title,
            }) || test.title;

            const time = typeof test.duration === 'number' ? (test.duration / 1000).toFixed(3) : '0';

            const base = `<testcase classname="${escape(classname)}" name="${escape(title)}" time="${escape(time)}">`;

            if (test.status === 'failed') {
              const message = (test.failureMessages || []).join('\n\n');
              return `${base}<failure><![CDATA[${message}]]></failure></testcase>`;
            }

            if (test.status === 'pending' || test.status === 'skipped' || test.status === 'todo') {
              return `${base}<skipped/></testcase>`;
            }

            return `${base}</testcase>`;
          })
          .join('');

        return `<testsuite name="${escape(suiteNameValue || suiteName)}" tests="${tests}" failures="${failures}" skipped="${skipped}" time="${duration.toFixed(3)}">${testCasesXml}</testsuite>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="${escape(suiteName)}" tests="${results.numTotalTests}" failures="${results.numFailedTests}" skipped="${results.numPendingTests}" time="${totalTime.toFixed(3)}">${suitesXml}</testsuites>\n`;

    const outputPath = path.join(outputDir, outputName);
    fs.writeFileSync(outputPath, xml, 'utf8');
  }
}

module.exports = SimpleJunitReporter;
