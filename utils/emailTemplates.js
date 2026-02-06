
export const emailVerificationTemplate = (fullName, code) => {
    return `
        <!DOCTYPE html>
        <html lang="en" style="margin: 0; padding: 0;">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Email Verification Code</title>
        </head>
        <body
            style="
            margin: 0;
            padding: 0;
            background-color: #f5f8ff;
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            "
        >
            <table
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background-color: #f5f8ff; padding: 40px 0;"
            >
            <tr>
                <td align="center">
                <table
                    width="480"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    "
                >
                    <!-- Header -->
                    <tr>
                    <td
                        align="center"
                        style="
                        background-color: #0a66c2;
                        color: #ffffff;
                        padding: 24px 0;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 0.5px;
                        "
                    >
                        Verify Your Email
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="padding: 32px 24px; color: #333333;">
                        <p style="font-size: 16px; margin: 0 0 12px;">
                        Hello ${fullName},
                        </p>
                        <p style="font-size: 16px; margin: 0 0 24px;">
                        Please use the following verification code to complete your sign-up process:
                        </p>

                        <!-- Verification Code Box -->
                        <div
                        style="
                            text-align: center;
                            background-color: #f0f6ff;
                            border: 2px dashed #0a66c2;
                            color: #0a66c2;
                            font-size: 28px;
                            font-weight: bold;
                            letter-spacing: 6px;
                            padding: 16px 0;
                            border-radius: 8px;
                            margin: 0 auto 24px;
                        "
                        >
                            ${code}
                        </div>

                        <p style="font-size: 15px; margin: 0 0 12px; color: #555;">
                        This code will expire in <strong>5 minutes</strong>. If you didn’t request this, you can safely ignore this email.
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td
                        align="center"
                        style="
                        background-color: #f5f8ff;
                        padding: 20px;
                        font-size: 13px;
                        color: #777;
                        "
                    >
                        &copy; 2025 BELLSTECH ALUMNI. All rights reserved.
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </body>
        </html>

    `
}

export const passwordResetTemplate = ( code) => {
    return `
        <!DOCTYPE html>
        <html lang="en" style="margin: 0; padding: 0;">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Password Reset</title>
        </head>
        <body
            style="
            margin: 0;
            padding: 0;
            background-color: #f5f8ff;
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            "
        >
            <table
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background-color: #f5f8ff; padding: 40px 0;"
            >
            <tr>
                <td align="center">
                <table
                    width="480"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    "
                >
                    <!-- Header -->
                    <tr>
                    <td
                        align="center"
                        style="
                        background-color: #0a66c2;
                        color: #ffffff;
                        padding: 24px 0;
                        font-size: 22px;
                        font-weight: bold;
                        letter-spacing: 0.5px;
                        "
                    >
                        Password Reset Request
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="padding: 32px 24px; color: #333333;">
                        <p style="font-size: 16px; margin: 0 0 12px;">
                        Hello,
                        </p>
                        <p style="font-size: 16px; margin: 0 0 24px;">
                        Please use the following  code to reset your password:
                        </p>

                        <!-- Verification Code Box -->
                        <div
                        style="
                            text-align: center;
                            background-color: #f0f6ff;
                            border: 2px dashed #0a66c2;
                            color: #0a66c2;
                            font-size: 28px;
                            font-weight: bold;
                            letter-spacing: 6px;
                            padding: 16px 0;
                            border-radius: 8px;
                            margin: 0 auto 24px;
                        "
                        >
                            ${code}
                        </div>

                        <p style="font-size: 15px; margin: 0 0 12px; color: #555;">
                        This code will expire in <strong>5 minutes</strong>. If you didn’t request this, you can safely ignore this email.
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td
                        align="center"
                        style="
                        background-color: #f5f8ff;
                        padding: 20px;
                        font-size: 13px;
                        color: #777;
                        "
                    >
                        &copy; 2025 BELLSTECH ALUMNI. All rights reserved.
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </body>
        </html>

    `
}

export const welcomeEmailTemplate = (fullName) => {
    return `
        <!DOCTYPE html>
        <html lang="en" style="margin: 0; padding: 0;">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Welcome to Bells University Alumni Community</title>
        </head>
        <body
            style="
            margin: 0;
            padding: 0;
            background-color: #f5f8ff;
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #333;
            "
        >
            <table
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="background-color: #f5f8ff; padding: 40px 0;"
            >
            <tr>
                <td align="center">
                <table
                    width="520"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    "
                >
                    <!-- Header -->
                    <tr>
                    <td
                        align="center"
                        style="
                        background-color: #0a66c2;
                        color: #ffffff;
                        padding: 32px 20px;
                        "
                    >
                        <h1 style="margin: 0; font-size: 26px; font-weight: 700;">
                        🎉 Congratulations, Bells University Graduate! 🎓
                        </h1>
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="padding: 32px 24px;">
                        <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
                        We are thrilled to welcome you to the
                        <strong>Bells University Alumni Community</strong> — a network
                        of achievers, innovators, and changemakers making impact around
                        the world.
                        </p>

                        <p style="font-size: 16px; line-height: 1.6;">
                        As a proud Alumnus of Bells University, you now have lifelong
                        access to <strong>exclusive alumni resources</strong>,
                        networking opportunities, and community benefits designed to
                        help you stay connected and continue to grow.
                        </p>

                        <div
                        style="
                            background-color: #f0f6ff;
                            border-left: 4px solid #0a66c2;
                            padding: 16px 20px;
                            border-radius: 6px;
                            margin: 24px 0;
                        "
                        >
                        <p style="margin: 0; font-size: 15px;">
                            💡 You can now sign up or sign in to your
                            <strong>Alumni Member Account</strong> using the email
                            address you used during your alumni payment to enjoy these
                            privileges and opportunities.
                        </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                        <a
                            href="https://www.bellsuniversityalumni.com/register"
                            style="
                            background-color: #0a66c2;
                            color: #ffffff;
                            padding: 14px 28px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: 600;
                            display: inline-block;
                            "
                            >Access Alumni Portal</a
                        >
                        </div>

                        <p
                        style="
                            font-size: 15px;
                            line-height: 1.6;
                            color: #555;
                            text-align: center;
                        "
                        >
                        Stay connected. Grow together.<br />
                        <strong>Bells University Alumni Association</strong>
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td
                        align="center"
                        style="
                        background-color: #f5f8ff;
                        padding: 20px;
                        font-size: 13px;
                        color: #777;
                        "
                    >
                        &copy; {{YEAR}} Bells University Alumni Association. All rights
                        reserved.
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </body>
        </html>

    `
}