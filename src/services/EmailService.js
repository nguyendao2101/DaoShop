const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendOTPEmail(email, otp, userName) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'DaoShop - Xác thực tài khoản',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Chào mừng bạn đến với DaoShop!</h2>
                        <p>Xin chào <strong>${userName}</strong>,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại DaoShop. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP sau:</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                            <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                        </div>
                        
                        <p><strong>Lưu ý:</strong></p>
                        <ul>
                            <li>Mã OTP này có hiệu lực trong <strong>10 phút</strong></li>
                            <li>Không chia sẻ mã này với bất kỳ ai</li>
                            <li>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này</li>
                        </ul>
                        
                        <hr style="margin: 30px 0;">
                        <p style="color: #666; font-size: 14px;">
                            Trân trọng,<br>
                            Đội ngũ DaoShop
                        </p>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('OTP Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Send OTP email error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendWelcomeEmail(email, userName) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'DaoShop - Chào mừng bạn!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #28a745;">Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công!</h2>
                        <p>Xin chào <strong>${userName}</strong>,</p>
                        <p>Tài khoản DaoShop của bạn đã được xác thực và kích hoạt thành công!</p>
                        <p>Bây giờ bạn có thể đăng nhập và khám phá các sản phẩm tuyệt vời tại DaoShop.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="#" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Bắt đầu mua sắp</a>
                        </div>
                        
                        <hr style="margin: 30px 0;">
                        <p style="color: #666; font-size: 14px;">
                            Trân trọng,<br>
                            Đội ngũ DaoShop
                        </p>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Welcome Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Send welcome email error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();