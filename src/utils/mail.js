import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagelink.com",
        },
    });

    const emailText = mailGenerator.generatePlaintext(options.mailgenContent); // Incase browser doesn't support HTML

    const emailHTML = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASSWORD,
        },
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHTML,
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error(
            `Email service failed siliently. Make sure that you have provided your MAILTRAP credentials in the .env file.`,
        );
        console.error(`Error: ${error}`);
    }
};

const emailVerificationMailGenContent = function (username, verificationUrl) {
    return {
        body: {
            name: username,
            intro: "Welcome to our app! We are excited to have you on board.",
            action: {
                instructions:
                    "To verify your email, please click on the following button.",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationUrl,
                },
            },
            outro: "Need help or have questions, just reply to this email, we'd love to help.",
        },
    };
};

const forgotPasswordMailGenContent = function (username, passwordResetUrl) {
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of your account.",
            action: {
                instructions:
                    "To reset your password, please click on the following button.",
                button: {
                    color: "#3da5eb",
                    text: "Reset password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help or have questions, just reply to this email, we'd love to help.",
        },
    };
};

export {
    emailVerificationMailGenContent,
    forgotPasswordMailGenContent,
    sendEmail,
};
