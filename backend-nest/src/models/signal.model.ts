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
const Signal = sequelize.define('Signal', {
  signal_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  mmsi: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: { len: [9, 9] },
  },
  signal_type: {
    type: DataTypes.ENUM('test', 'alert', 'unscheduled'),
    allowNull: false,
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  coordinates: {
<<<<<<< HEAD
    type: DataTypes.STRING, // Формат: "latitude,longitude"
=======
    type: DataTypes.STRING,
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('unlinked', 'processing', 'completed', 'rejected'),
    defaultValue: 'unlinked',
  },
  comments: {
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

export default Signal;
=======
# });
# sequelize.sync();
# export default Signal;
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
