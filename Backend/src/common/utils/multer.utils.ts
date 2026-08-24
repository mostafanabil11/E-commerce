import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
    storage : diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
            const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
            return cb(null, `${randomName}${extname(file.originalname)}`)
        } 
    }),
    fileFilter: (req : Request, file : Express.Multer.File, cb : any) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    limit : {
        fileSize: 1024 * 1024 * 5
    }
}
