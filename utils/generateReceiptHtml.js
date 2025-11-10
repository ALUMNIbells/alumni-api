// utils/generateReceiptHtml.js
// const QRCode = require("qrcode");
import numberToWords from 'number-to-words';


export async function generateReceiptHtml(transaction, paidAt, receiptNo) {
  const { matricNo, paymentref, amount, fullName, type } = transaction;

  // const qrDataUrl = await QRCode.toDataURL(`https://nacos-weld.vercel.app/verified-page?ref=${paymentref}`);
  // console.log(qrDataUrl);
  return `
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Bells Alumni Transfer Receipt</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Great+Vibes&display=swap" rel="stylesheet">
      <style>
        body {
          background: #f4f4f4;
          font-family: 'Roboto', Arial, sans-serif;
          padding: 40px;
        }

        .receipt {
          width: 620px;
          max-width: 95vw;
          background: #fff;
          border: 1.5px solid #000;
          padding: 35px 40px 90px 40px;
          margin: 0 auto;
          position: relative;
          border-radius: 6px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }

        /* Header section */
        .header {
          text-align: center;
          line-height: 1.3;
        }
        .header h1 {
          margin: 0;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        .header p {
          margin: 4px 0;
          font-size: 13.5px;
          color: #333;
        }

        .cash-receipt-box {
          background: #000;
          color: #fff;
          display: inline-block;
          padding: 5px 15px;
          font-size: 15px;
          font-weight: 700;
          margin: 10px 0;
          border-radius: 4px;
          letter-spacing: 0.6px;
        }

        .receipt-no {
          font-size: 13.5px;
          font-weight: 600;
          margin-top: 5px;
          color: #222;
        }

        /* Fields section */
        .fields {
          margin-top: 25px;
          font-size: 15px;
          line-height: 1.6;
        }

        .line {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .line label {
          min-width: 165px;
          font-size: 16px;
          color: #000;
          font-weight: 700;
        }
        .underline {
          display: inline-block;
          border-bottom: 1px solid #000;
          padding: 0 6px 3px 6px;
          font-size: 16.5px;
          color: #153a67;
          flex: 1;
          letter-spacing: 0.3px;
        }

        /* Signature line */
        .sign {
          position: relative;
          margin-top: 70px;
          text-align: right;
          font-size: 13px;
          padding-right: 45px;
          color: #222;
        }
        .sig-line {
          border-top: 1px solid #000;
          width: 190px;
          height: 25px;
          margin-bottom: 4px;
          margin-left: auto;
        }

        /* Amount box (₦ : K) */
        .amount-box {
          margin-top: 45px;
          border: 1.5px solid #000;
          width: 190px;
          height: 75px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 1px;
          border-radius: 5px;
        }
        .amount-box span {
          font-size: 22px;
          font-weight: 700;
        }

        /* Footer */
        .footer {
          margin-top: 25px;
          font-size: 12.5px;
          color: #444;
          text-align: center;
          font-weight: 500;
        }
        .note {
          margin-top: 6px;
          font-size: 12.5px;
          color: #444;
          text-align: center;
          letter-spacing: 0.3px;
        }

        /* Logo row */
        .logo-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }
        .logo-row img {
          object-fit: contain;
        }

        /* Print format */
        @media print {
          body {
            background: none;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
          }
          .receipt {
            margin: 0 auto;
            box-shadow: none;
            border: 1px solid #000;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="logo-row">
          <img src="https://res.cloudinary.com/dyxnndiww/image/upload/v1761609393/images-removebg-preview_gpu6qw.png" alt="Left logo" style="height: 100px; width: 100px;">
          <div class="header">
            <h1>BELLS UNIVERSITY ALUMNI ASSOCIATION</h1>
            <h2>BELLS UNIVERSITY OF TECHNOLOGY<br>OTA</h2>
            <p>Km 8, Idiroko Road Expressway Ota, Ogun State.</p>
            <div class="cash-receipt-box">Transfer Receipt</div>
            <div class="receipt-no">Receipt No: ${receiptNo.toString().padStart(4, "0")}</div>
          </div>
          <img src="https://res.cloudinary.com/dyxnndiww/image/upload/v1761609392/bells_zfvjyl.png" alt="Right logo" style="height: 110px; width: 110px;">
        </div>

        <div class="fields">
          <div class="line">
            <label>Received from:</label>
            <div class="underline">${fullName.toUpperCase()}</div>
          </div>

          <div class="line">
            <label>The sum of:</label>
            <div class="underline">${numberToWords.toWords(amount).toUpperCase()} NAIRA ONLY</div>
          </div>

          <div class="line">
            <label>Being payment for:</label>
            <div class="underline">${type.toUpperCase()}</div>
          </div>

          <div class="line">
            <label>Date:</label>
            <div class="underline">${new Date(paidAt).toLocaleString("en-NG", {
              timeZone: "Africa/Lagos",
              hour12: true,
            })}</div>
          </div>

          <div class="line">
            <label>Payment Reference:</label>
            <div class="underline">${paymentref}</div>
          </div>
        </div>

        <!-- Signature -->
        <div class="sign">
          <div class="sig-line"></div>
          <div>Treasurer Sign</div>
        </div>

        <!-- ₦ : K amount box -->
        <div class="amount-box">
          <span>₦</span>
          <span style="text-align:left;">${amount}</span>
          <span>:</span>
          <span>00</span>
          <span>K</span>
        </div>

        <!-- Footer -->
        <div class="footer">Note: Keep this receipt as proof of payment.</div>
        <p class="note">Email: bellstechalumni@bellsuniversity.edu.ng</p>
        <p class="note">© 2025 BELLSTECH ALUMNI - All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

