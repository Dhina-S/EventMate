package com.eventmate.eventmate_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String fromEmail;

    @org.springframework.scheduling.annotation.Async
    public void sendBookingConfirmation(String toEmail, String userName, String eventTitle, String bookingId, int tickets, double amount, String ticketNumber) {
        if (fromEmail == null || fromEmail.isEmpty() || fromEmail.equals("your_gmail_account@gmail.com")) {
            System.err.println("SMTP credentials not configured. Skipping HTML email sending for booking: " + bookingId);
            return;
        }

        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your EventMate Ticket: " + eventTitle);

            // Use an external QR code generator API
            String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + ticketNumber;

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);'>" +
                    "<h2 style='color: #333333; text-align: center;'>Your Ticket is Confirmed! 🎉</h2>" +
                    "<p style='color: #555555; font-size: 16px;'>Hi " + userName + ",</p>" +
                    "<p style='color: #555555; font-size: 16px;'>Thank you for booking with EventMate. Here are your ticket details for <strong>" + eventTitle + "</strong>.</p>" +
                    "<hr style='border: 1px solid #eeeeee; margin: 20px 0;'/>" +
                    "<table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>" +
                    "<tr><td style='padding: 8px 0; color: #777777;'>Event:</td><td style='padding: 8px 0; color: #333333; font-weight: bold;'>" + eventTitle + "</td></tr>" +
                    "<tr><td style='padding: 8px 0; color: #777777;'>Tickets:</td><td style='padding: 8px 0; color: #333333; font-weight: bold;'>" + tickets + "</td></tr>" +
                    "<tr><td style='padding: 8px 0; color: #777777;'>Amount Paid:</td><td style='padding: 8px 0; color: #333333; font-weight: bold;'>$" + String.format("%.2f", amount) + "</td></tr>" +
                    "<tr><td style='padding: 8px 0; color: #777777;'>Ticket ID:</td><td style='padding: 8px 0; color: #333333; font-weight: bold;'>" + ticketNumber + "</td></tr>" +
                    "</table>" +
                    "<div style='text-align: center; margin: 30px 0;'>" +
                    "<p style='color: #555555; font-size: 14px; margin-bottom: 10px;'>Show this QR code at the entrance:</p>" +
                    "<img src='" + qrCodeUrl + "' alt='Ticket QR Code' style='border: 2px solid #ddd; border-radius: 8px; padding: 10px; width: 200px; height: 200px;'/>" +
                    "</div>" +
                    "<p style='color: #555555; font-size: 14px; text-align: center;'>You can also view this ticket on your dashboard: <a href='" + frontendUrl + "/dashboard'>View Dashboard</a></p>" +
                    "<p style='color: #555555; font-size: 14px; text-align: center;'>We hope you enjoy the event!</p>" +
                    "<p style='color: #999999; font-size: 12px; text-align: center; margin-top: 30px;'>&copy; " + java.time.Year.now().getValue() + " EventMate. All rights reserved.</p>" +
                    "</div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("✅ HTML Email sent to " + toEmail);

        } catch (Exception e) {
            System.err.println("Failed to send HTML ticket email: " + e.getMessage());
        }
    }
}