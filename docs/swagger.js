import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Alumni API",
      version: "1.0.0",
      description: "API documentation for the alumni platform",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Local server",
      },
      {
        url: "https://www.bellsuniversityalumni.com/api/v1",
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
  apis: ["./routes/**/*.js", "./docs/**/*.md"], // where swagger will read comments from
};

export const swaggerSpec = swaggerJsdoc(options);
