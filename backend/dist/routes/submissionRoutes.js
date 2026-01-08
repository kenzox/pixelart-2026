"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const supabase_1 = __importDefault(require("../config/supabase"));
const router = express_1.default.Router();
// Multer Yapılandırması: Dosya yükleme işlemleri için bellek içi depolama ayarları
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB dosya boyutu limiti
    fileFilter: fileFilter,
});
router.post('/submit-art', upload.single('file'), async (req, res) => {
    try {
        const { artist_name, description, email } = req.body;
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
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (ext === '.pdf') {
            folder = 'pdf-application';
        }
        else if (ext === '.jpg' || ext === '.jpeg') {
            folder = 'jpg-application';
        }
        else if (ext === '.png') {
            folder = 'png-application';
        }
        const fileName = `${folder}/${(0, uuid_1.v4)()}${ext}`;
        // Supabase Storage servisine dosya yükleme işlemi
        const { data: uploadData, error: uploadError } = await supabase_1.default.storage
            .from('artworks')
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });
        if (uploadError) {
            throw uploadError;
        }
        // Yüklenen dosyanın herkese açık (public) erişim bağlantısını al
        const { data: publicUrlData } = supabase_1.default.storage
            .from('artworks')
            .getPublicUrl(fileName);
        const publicUrl = publicUrlData.publicUrl;
        // Başvuru bilgilerini Supabase veritabanına kaydet
        const { data: insertData, error: insertError } = await supabase_1.default
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
        const transporter = nodemailer_1.default.createTransport({
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
        }
        catch (emailError) {
            console.error('Failed to send email:', emailError);
            // E-posta gönderimi başarısız olsa bile kullanıcı başvurusunu iptal etme, sadece hatayı logla.
        }
        res.status(201).json({
            message: 'Submission successful',
            data: insertData ? insertData[0] : null,
        });
    }
    catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
exports.default = router;
