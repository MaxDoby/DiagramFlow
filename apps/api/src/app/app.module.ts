import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { validateEnvironment } from './config/environment.schema';
import { ProfileModule } from './modules/profile/profile.module';
import { AvatarStorageService } from './modules/profile/avatar/avatar-storage.service';
import { FolderModule } from './modules/folder/folder.module';
import { DiagramModule } from './modules/diagram/diagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AuthModule,
    ProfileModule,
    FolderModule,
    DiagramModule,
  ],

  controllers: [AppController],
  providers: [AppService, AvatarStorageService],
})
export class AppModule {}
