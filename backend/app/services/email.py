"""Email service for sending magic links and notifications."""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using SMTP.

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email

    Returns:
        True if email was sent successfully, False otherwise
    """
    logger.info(f"Attempting to send email to {to_email}")

    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP credentials not configured, skipping email send")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = (
            f"{settings.smtp_from_name} <{settings.smtp_from_email or settings.smtp_user}>"
        )
        msg["To"] = to_email

        # Create HTML part
        html_part = MIMEText(html_content, "html")
        msg.attach(html_part)

        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(
                settings.smtp_from_email or settings.smtp_user, to_email, msg.as_string()
            )

        logger.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_magic_link_email(to_email: str, magic_link: str, user_name: str) -> bool:
    """Send a magic link email for first-time password setup.

    Args:
        to_email: Recipient email address
        magic_link: The magic link URL
        user_name: User's display name

    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = "DuoBudget - Créez votre mot de passe"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 20px;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏦 DuoBudget</h1>
        </div>
        <div class="content">
            <h2>Bonjour {user_name} ! 👋</h2>
            <p>Bienvenue sur DuoBudget ! Pour accéder à votre compte, vous devez créer votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe :</p>
            <p style="text-align: center;">
                <a href="{magic_link}" class="button">Créer mon mot de passe</a>
            </p>
            <div class="warning">
                ⚠️ Ce lien expire dans <strong>15 minutes</strong>. Si vous n'avez pas demandé cet email, ignorez-le simplement.
            </div>
        </div>
        <div class="footer">
            <p>DuoBudget - Gestion de budget partagé pour Marie & Seb</p>
        </div>
    </body>
    </html>
    """

    return await send_email(to_email, subject, html_content)


async def send_password_reset_email(to_email: str, reset_link: str, user_name: str) -> bool:
    """Send a password reset email.

    Args:
        to_email: Recipient email address
        reset_link: The password reset link URL
        user_name: User's display name

    Returns:
        True if email was sent successfully, False otherwise
    """
    subject = "DuoBudget - Réinitialisation de mot de passe"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 20px;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏦 DuoBudget</h1>
        </div>
        <div class="content">
            <h2>Bonjour {user_name} !</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
            <p style="text-align: center;">
                <a href="{reset_link}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <div class="warning">
                ⚠️ Ce lien expire dans <strong>15 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </div>
        </div>
        <div class="footer">
            <p>DuoBudget - Gestion de budget partagé pour Marie & Seb</p>
        </div>
    </body>
    </html>
    """

    return await send_email(to_email, subject, html_content)
