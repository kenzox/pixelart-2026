import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import nodemailer from 'nodemailer';
import supabase from '../config/supabase';

const router = express.Router();

// Multer Yapılandırması: Dosya yükleme işlemleri için bellek içi depolama ayarları
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB dosya boyutu limiti
    fileFilter: fileFilter,
});

interface SubmissionBody {
    artist_name: string;
    description: string;
    email: string;
}

router.post('/submit-art', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
        const { artist_name, description, email } = req.body as SubmissionBody;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        if (!artist_name || !email) {
            res.status(400).json({ error: 'Artist name and email are required' });
            return;
        }

        // Dosya türüne göre uygun klasörü belirle
        let folder = 'others';
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.pdf') {
            folder = 'pdf-application';
        } else if (ext === '.jpg' || ext === '.jpeg') {
            folder = 'jpg-application';
        } else if (ext === '.png') {
            folder = 'png-application';
        }

        const fileName = `${folder}/${uuidv4()}${ext}`;

        // Supabase Storage servisine dosya yükleme işlemi
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artworks')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
            });

        if (uploadError) {
            throw uploadError;
        }

        // Yüklenen dosyanın herkese açık (public) erişim bağlantısını al
        const { data: publicUrlData } = supabase.storage
            .from('artworks')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        // Başvuru bilgilerini Supabase veritabanına kaydet
        const { data: insertData, error: insertError } = await supabase
            .from('submissions')
            .insert([
                {
                    artist_name,
                    description,
                    email,
                    public_url: publicUrl,
                },
            ])
            .select();

        if (insertError) {
            throw insertError;
        }

        // Başvuru sahibine bilgilendirme e-postası gönder
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false, // 465 portu için true, diğer portlar için false kullanın
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: `"PixelArt 2026" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'PixelArt 2026 Başvurunuz Alındı',
                text: `Sayın ${artist_name},\n\nBaşvurunuz başarıyla alınmıştır. Dosyanıza buradan ulaşabilirsiniz: ${publicUrl}\n\nTeşekkürler,\nPixelArt 2026 Ekibi`,
                html: `<p>Sayın <b>${artist_name}</b>,</p><p>Başvurunuz başarıyla alınmıştır.</p><p>Dosyanıza buradan ulaşabilirsiniz: <a href="${publicUrl}">${publicUrl}</a></p><br><p>Teşekkürler,<br>PixelArt 2026 Ekibi</p>`,
            });
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // E-posta gönderimi başarısız olsa bile kullanıcı başvurusunu iptal etme, sadece hatayı logla.
        }

        res.status(201).json({
            message: 'Submission successful',
            data: insertData ? insertData[0] : null,
        });

    } catch (error: any) {
        console.error('Submission error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

export default router;
