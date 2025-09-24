import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from '../controllers/user.controller';
import { UserService } from './user.service';
import User from '../models/user.model';
import { AuthService } from '../security/auth.service';
import { AuthGuard } from '../security/auth.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([User])
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,  // Нужен для AuthGuard
    AuthGuard     // Используется в UserController
  ],
  exports: [UserService] // Экспортируем для использования в других модулях
})
export class UserModule {}