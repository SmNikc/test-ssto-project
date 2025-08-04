<<<<<<< HEAD
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL!, { dialect: 'postgres' });

=======
CopyEdit
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
# dotenv.config();
# const sequelize = new Sequelize(process.env.DB_URL!, { dialect: 'postgres' });
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
const Log = sequelize.define('Log', {
  log_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  event: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  details: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
<<<<<<< HEAD
});

sequelize.sync();

export default Log;
=======
# });
# sequelize.sync();
# export default Log;
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
