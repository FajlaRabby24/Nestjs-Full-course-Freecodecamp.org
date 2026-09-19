import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload/files',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
  }

  // validate file
  @Post('upload-png')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload/files',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
      // file size validation
      // limits: {
      //   fileSize: 70707,
      // },
      fileFilter: (req, file, cb) => {
        // mime type validation
        if (!file.mimetype.match(/\/(png)$/)) {
          return cb(
            new BadRequestException('Only png file are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadPngFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        // file size validation
        .addMaxSizeValidator({ maxSize: 70707 })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    console.log(file);
    return 'success';
  }
}
// 12:49
