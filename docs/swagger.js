import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Payments API",
      version: "1.0.0",
      description: "API documentation for the payment system",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local server",
      },
      {
        url: "https://your-production-domain.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/**/*.js"], // where swagger will read comments from
};

export const swaggerSpec = swaggerJsdoc(options);
