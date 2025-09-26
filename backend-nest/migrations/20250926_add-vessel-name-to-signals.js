'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'signals';
    const column = 'vessel_name';

    const [rows] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='${table}' AND column_name='${column}'
    `);

    if (!rows || rows.length === 0) {
      await queryInterface.addColumn(table, column, {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log(`[migrate] Column ${table}.${column} added`);
    } else {
      console.log(`[migrate] Column ${table}.${column} already exists — skip`);
    }
  },

  async down(queryInterface/*, Sequelize*/) {
    const table = 'signals';
    const column = 'vessel_name';
    try {
      await queryInterface.removeColumn(table, column);
      console.log(`[migrate:down] Column ${table}.${column} removed`);
    } catch (e) {
      console.warn(`[migrate:down] removeColumn skipped: ${e.message}`);
    }
  }
};