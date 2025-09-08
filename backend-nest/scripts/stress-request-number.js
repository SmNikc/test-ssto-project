// backend-nest/scripts/stress-request-number.js
// Проверка уникальности request_number с авто-учётом реальной схемы requests.
// Запуск: node backend-nest/scripts/stress-request-number.js 100

const { Client } = require('pg');
const N = Number(process.argv[2] || 50);

// Базовые значения по умолчанию (если колонка существует).
function defaultValues(i) {
  const nowISO = new Date().toISOString();
  return {
    vessel_name: `Stress-${i}`,
    mmsi: `273${String(100000 + i).padStart(6, '0')}`,
    // орг-контур
    owner_organization: 'StressOrg',
    ship_owner: 'N/A SHIP OWNER',          // ВАЖНО: чтобы не нарушать NOT NULL
    contact_person: 'Stress Bot',
    contact_phone: '+79990000000',
    contact_email: `stress${i}@example.com`,
    terminal_number: `TERM-STRESS-${i}`,
    // статус
    status: 'approved',
    // даты/время
    planned_test_date: nowISO,
    test_date: nowISO,
    // системные штампы (если требуются NOT NULL без DEFAULT)
    created_at: nowISO,
    updated_at: nowISO,
  };
}

// Исключаем только действительно служебные/виртуальные поля,
// которые нельзя/не нужно вставлять руками.
const EXCLUDE_COLS = new Set([
  'id',            // PK авто
  'request_id',    // виртуальное/служебное
  'request_number' // выставляет триггер
]);

async function readColumns(client) {
  const res = await client.query(`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='requests'
  `);
  const map = new Map();
  for (const r of res.rows) {
    map.set(r.column_name, {
      name: r.column_name,
      data_type: (r.data_type || '').toLowerCase(), // e.g. 'character varying', 'timestamp without time zone', 'user-defined'
      udt_name: r.udt_name || null,                 // enum type name
      is_nullable: r.is_nullable === 'YES',
      column_default: r.column_default || null
    });
  }
  return map;
}

async function readEnumLabels(client, enumTypeName) {
  const res = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = $1
    ORDER BY e.enumsortorder
  `, [enumTypeName]);
  return res.rows.map(r => r.enumlabel);
}

function pickEnumPreferred(labels, columnDefault, preferList) {
  for (const pref of preferList) {
    const hit = labels.find(l => l.toLowerCase() === pref.toLowerCase());
    if (hit) return hit;
  }
  if (columnDefault) {
    const m = /'([^']+)'::/i.exec(columnDefault);
    if (m) {
      const hit = labels.find(l => l.toLowerCase() === m[1].toLowerCase());
      if (hit) return hit;
    }
  }
  return labels[0] || null;
}

function fallbackValueByType(col, enumChoice) {
  const t = col.data_type || '';
  if (t.includes('user-defined')) return enumChoice || 'N/A';
  if (t.includes('timestamp') || t.includes('time') || t.includes('date')) return new Date().toISOString();
  if (t.includes('character') || t.includes('text')) return 'N/A';
  if (t.includes('boolean')) return false;
  if (t.includes('integer') || t.includes('smallint') || t.includes('bigint')) return 0;
  if (t.includes('numeric') || t.includes('decimal') || t.includes('double') || t.includes('real')) return 0;
  if (t.includes('json')) return '{}';
  return 'N/A';
}

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'ssto',
    password: process.env.DB_PASSWORD || 'sstopass',
    database: process.env.DB_NAME || 'sstodb',
  });
  await client.connect();

  try {
    const colMeta = await readColumns(client);
    if (colMeta.size === 0) throw new Error("Не удалось прочитать колонки таблицы 'requests'");

    // реальные колонки без исключений
    const realCols = [...colMeta.keys()].filter(n => !EXCLUDE_COLS.has(n));

    // NOT NULL и без DEFAULT — их обязательно заполняем
    const requiredCols = [...colMeta.values()]
      .filter(c => !c.is_nullable && !c.column_default && !EXCLUDE_COLS.has(c.name))
      .map(c => c.name);

    // предпочитаемый порядок «полезных» полей
    const preferredOrder = [
      'vessel_name',
      'mmsi',
      'owner_organization',
      'ship_owner',          // важно чтобы попало
      'contact_person',
      'contact_phone',
      'contact_email',
      'terminal_number',
      'status',
      'planned_test_date',
      'test_date',
      'created_at',          // если NOT NULL без DEFAULT — вставим
      'updated_at'
    ];
    const finalColsSet = new Set(
      [...preferredOrder, ...requiredCols].filter(c => realCols.includes(c))
    );

    // подобрать корректный статус (ENUM → 'approved' если доступно)
    let chosenStatus = null;
    if (finalColsSet.has('status')) {
      const meta = colMeta.get('status');
      if (meta && meta.data_type === 'user-defined' && meta.udt_name) {
        const labels = await readEnumLabels(client, meta.udt_name);
        chosenStatus = pickEnumPreferred(labels, meta.column_default, [
          'approved', 'submitted', 'draft', 'pending', 'in_review', 'in_testing',
          'rejected', 'completed', 'failed', 'cancelled'
        ]);
        if (!chosenStatus) {
          finalColsSet.delete('status');
          console.log("[stress] 'status' (ENUM): подходящей метки нет — поле пропускаем");
        } else {
          console.log(`[stress] Используем статус ENUM: ${chosenStatus}`);
        }
      } else {
        chosenStatus = 'approved';
        console.log(`[stress] 'status' текстовый — используем: ${chosenStatus}`);
      }
    }

    if (finalColsSet.size === 0) {
      throw new Error("После фильтрации не осталось колонок для вставки");
    }

    // построитель параметров на основе defaultValues + обязательных NOT NULL
    function buildParams(i) {
      const dv = defaultValues(i);
      if (chosenStatus) dv.status = chosenStatus;

      const params = [];
      for (const colName of finalColsSet) {
        const meta = colMeta.get(colName);
        let val = (dv[colName] !== undefined) ? dv[colName] : null;

        if (val === null) {
          const must = requiredCols.includes(colName);
          if (must) {
            // ENUM?
            let enumVal = null;
            if (meta && meta.data_type === 'user-defined' && meta.udt_name) {
              enumVal = chosenStatus || null;
            }
            val = fallbackValueByType(meta, enumVal);
          } else {
            // Не обязательная — можно оставить null
            val = null;
          }
        }
        params.push(val);
      }
      return params;
    }

    // подготовим SQL
    const cols = [...finalColsSet];
    const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');
    const sql = `
      INSERT INTO requests (${cols.join(', ')})
      VALUES (${placeholders})
      RETURNING id, request_number
    `;

    // параллельные вставки
    const tasks = [];
    for (let i = 0; i < N; i++) {
      const params = buildParams(i);
      tasks.push(
        client.query(sql, params).then(r => r.rows[0]).catch(e => ({ error: e.message, params }))
      );
    }

    const inserted = await Promise.all(tasks);

    const numbers = [];
    const errors = [];
    for (const row of inserted) {
      if (row && row.error) {
        errors.push(row);
        continue;
      }
      if (!row) {
        errors.push({ error: 'unknown insert failure' });
        continue;
      }
      if (row.request_number) numbers.push(row.request_number);
    }

    if (errors.length) {
      console.error('❌ Ошибки при вставке некоторых записей:');
      errors.slice(0, 5).forEach((e, idx) => {
        console.error(`  [${idx + 1}] ${e.error}`);
        if (e.params) {
          const sample = cols.map((c, i) => `${c}=${JSON.stringify(e.params[i])}`).join(', ');
          console.error(`      cols: ${sample}`);
        }
      });
      if (errors.length > 5) console.error(`  ... ещё ${errors.length - 5} ошибок`);
      console.error('\n[Диагностика] Обязательные NOT NULL без default:', requiredCols.join(', ') || '(нет)');
      console.error('[Диагностика] Фактически вставляемые колонки:', cols.join(', ') || '(нет)');
      process.exitCode = 1;
      return;
    }

    const set = new Set(numbers);
    console.log(`Вставлено записей: ${inserted.length}`);
    console.log(`Получено request_number: ${numbers.length}`);
    console.log(`Уникальных request_number: ${set.size}`);
    if (numbers.length !== set.size) {
      console.error('❌ Найдены дубликаты request_number (память).');
      process.exitCode = 1;
    } else if (numbers.length === 0) {
      console.warn('⚠️  Сервер БД вернул 0 номеров (проверьте триггер trg_requests_request_number).');
      process.exitCode = 1;
    } else {
      console.log('Примеры номеров:', numbers.slice(0, 5).join(', '));
      console.log('✅ Дубликатов не обнаружено.');
    }

  } catch (e) {
    console.error('❌ Ошибка стресс-скрипта:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
}

main();
