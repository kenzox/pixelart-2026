const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');

const router = express.Router();

// Multer Configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

router.post('/submit-art', upload.single('file'), async (req, res) => {
    try {
        const { artist_name, description, email } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!artist_name || !email) {
            return res.status(400).json({ error: 'Artist name and email are required' });
        }

        // Determine folder based on file type
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

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artworks')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('artworks')
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        // Save to Database
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

        // Email Notification
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
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
            // We don't want to fail the request if email sending fails, just log it.
        }

        res.status(201).json({
            message: 'Submission successful',
            data: insertData[0],
        });

    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

module.exports = router;
