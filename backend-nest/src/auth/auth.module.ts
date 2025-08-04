<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService],
  exports: [AuthService],
=======
CopyEdit
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
@Module({
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
})
export class AuthModule {}
