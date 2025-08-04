<<<<<<< HEAD
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL!, {
  dialect: 'postgres',
});

export default sequelize;
=======
CopyEdit
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
# dotenv.config();
# const sequelize = new Sequelize(process.env.DB_URL!, {
  dialect: 'postgres',
# });
# export default sequelize;
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
