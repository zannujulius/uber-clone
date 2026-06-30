import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ride Hailing API Gateway",
      version: "1.0.0",
      description:
        "API Gateway for a ride-hailing platform (Uber-like). Handles authentication, authorization, rate limiting, and proxying to downstream microservices.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development server" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: [
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "password",
          ],
          properties: {
            first_name: { type: "string", example: "John" },
            last_name: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            phone_number: { type: "string", example: "+1234567890" },
            password: { type: "string", minLength: 8, example: "password123" },
            gender: {
              type: "string",
              enum: ["MALE", "FEMALE", "OTHER"],
              example: "MALE",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "password123" },
          },
        },
        Rider: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
            first_name: { type: "string", example: "John" },
            last_name: { type: "string", example: "Doe" },
            email: { type: "string", example: "john@example.com" },
            phone_number: { type: "string", example: "+1234567890" },
            gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"] },
            is_active: { type: "boolean", example: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Driver: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            },
            first_name: { type: "string", example: "Ali" },
            last_name: { type: "string", example: "Hassan" },
            email: { type: "string", example: "ali@example.com" },
            phone_number: { type: "string", example: "+9876543210" },
            gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"] },
            status: {
              type: "string",
              enum: ["ONLINE", "OFFLINE", "ON_TRIP"],
              example: "OFFLINE",
            },
            vehicle_id: { type: "string", format: "uuid", nullable: true },
            is_active: { type: "boolean", example: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                refreshToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Something went wrong" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: {
                    type: "string",
                    example: "Valid email is required",
                  },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          description: "Returns the current health status of the API Gateway.",
          responses: {
            200: {
              description: "Gateway is running",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "success" },
                      message: {
                        type: "string",
                        example: "API Gateway is running",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ─── Rider Auth ─────────────────────────────────────────────────────────
      "/api/v1/auth/rider/register": {
        post: {
          tags: ["Rider Auth"],
          summary: "Register a new rider",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Rider registered successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/AuthResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              rider: { $ref: "#/components/schemas/Rider" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            409: {
              description: "Email already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            429: {
              description: "Too many requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/rider/login": {
        post: {
          tags: ["Rider Auth"],
          summary: "Login as a rider",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/AuthResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              rider: { $ref: "#/components/schemas/Rider" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            429: {
              description: "Too many login attempts",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      // ─── Driver Auth ─────────────────────────────────────────────────────────
      "/api/v1/auth/driver/register": {
        post: {
          tags: ["Driver Auth"],
          summary: "Register a new driver",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Driver registered successfully",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/AuthResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              driver: { $ref: "#/components/schemas/Driver" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            409: {
              description: "Email already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            429: {
              description: "Too many requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/driver/login": {
        post: {
          tags: ["Driver Auth"],
          summary: "Login as a driver",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/AuthResponse" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              driver: { $ref: "#/components/schemas/Driver" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            429: {
              description: "Too many login attempts",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      // ─── Token ───────────────────────────────────────────────────────────────
      "/api/v1/auth/refresh": {
        post: {
          tags: ["Token"],
          summary: "Refresh access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: {
                    refreshToken: {
                      type: "string",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "New access token issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "success" },
                      data: {
                        type: "object",
                        properties: {
                          token: {
                            type: "string",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Refresh token missing",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            401: {
              description: "Invalid or expired refresh token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/me": {
        get: {
          tags: ["Token"],
          summary: "Get current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Current user payload from JWT",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "success" },
                      data: {
                        type: "object",
                        properties: {
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string", format: "uuid" },
                              role: {
                                type: "string",
                                enum: ["rider", "driver"],
                              },
                              iat: { type: "integer" },
                              exp: { type: "integer" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "No token or invalid token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      // ─── Proxy Routes ─────────────────────────────────────────────────────────
      "/api/v1/rider/{path}": {
        "x-swagger-router-controller": "proxy",
        get: { $ref: "#/components/pathItems/RiderProxy/get" },
        post: { $ref: "#/components/pathItems/RiderProxy/post" },
        put: { $ref: "#/components/pathItems/RiderProxy/put" },
        delete: { $ref: "#/components/pathItems/RiderProxy/delete" },
      },
      "/api/v1/driver/{path}": {
        get: { $ref: "#/components/pathItems/DriverProxy/get" },
        post: { $ref: "#/components/pathItems/DriverProxy/post" },
        put: { $ref: "#/components/pathItems/DriverProxy/put" },
        delete: { $ref: "#/components/pathItems/DriverProxy/delete" },
      },
      "/api/v1/location/{path}": {
        get: { $ref: "#/components/pathItems/LocationProxy/get" },
        post: { $ref: "#/components/pathItems/LocationProxy/post" },
      },
      "/api/v1/assignment/{path}": {
        get: { $ref: "#/components/pathItems/AssignmentProxy/get" },
        post: { $ref: "#/components/pathItems/AssignmentProxy/post" },
      },
    },

    // Shared proxy operation definitions (avoids repetition across methods)
    "x-tagGroups": [
      { name: "Auth", tags: ["Rider Auth", "Driver Auth", "Token"] },
      {
        name: "Proxied Services",
        tags: [
          "Rider Service",
          "Driver Service",
          "Location Service",
          "Assignment Service",
        ],
      },
      { name: "System", tags: ["System"] },
    ],
    tags: [
      { name: "Rider Auth", description: "Register and login for riders" },
      { name: "Driver Auth", description: "Register and login for drivers" },
      { name: "Token", description: "Token refresh and introspection" },
      {
        name: "Rider Service",
        description: "Proxied to Rider Service (requires rider JWT)",
      },
      {
        name: "Driver Service",
        description: "Proxied to Driver Service (requires driver JWT)",
      },
      {
        name: "Location Service",
        description: "Proxied to Location Service (requires any JWT)",
      },
      {
        name: "Assignment Service",
        description: "Proxied to Driver Assignment Service (requires any JWT)",
      },
      { name: "System", description: "Health and operational endpoints" },
    ],
  },
  apis: [],
};

const proxyOperation = (tag: string, summary: string, method: string) => ({
  tags: [tag],
  summary,
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "path",
      in: "path" as const,
      required: true,
      schema: { type: "string" },
      description: "Sub-path forwarded to the downstream service",
    },
  ],
  requestBody: ["post", "put", "patch"].includes(method)
    ? {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object", additionalProperties: true },
          },
        },
      }
    : undefined,
  responses: {
    200: { description: "Response from downstream service" },
    401: {
      description: "Missing or invalid JWT",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    403: {
      description: "Wrong role",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
    502: {
      description: "Downstream service unavailable",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
  },
});

// Inject proxy path operations directly into definition paths
const def = options.definition as any;

def.paths["/api/v1/rider/{path}"] = {
  parameters: [
    { name: "path", in: "path", required: true, schema: { type: "string" } },
  ],
  get: proxyOperation("Rider Service", "Forward GET to Rider Service", "get"),
  post: proxyOperation(
    "Rider Service",
    "Forward POST to Rider Service",
    "post",
  ),
  put: proxyOperation("Rider Service", "Forward PUT to Rider Service", "put"),
  delete: proxyOperation(
    "Rider Service",
    "Forward DELETE to Rider Service",
    "delete",
  ),
};

def.paths["/api/v1/driver/{path}"] = {
  parameters: [
    { name: "path", in: "path", required: true, schema: { type: "string" } },
  ],
  get: proxyOperation("Driver Service", "Forward GET to Driver Service", "get"),
  post: proxyOperation(
    "Driver Service",
    "Forward POST to Driver Service",
    "post",
  ),
  put: proxyOperation("Driver Service", "Forward PUT to Driver Service", "put"),
  delete: proxyOperation(
    "Driver Service",
    "Forward DELETE to Driver Service",
    "delete",
  ),
};

def.paths["/api/v1/location/{path}"] = {
  parameters: [
    { name: "path", in: "path", required: true, schema: { type: "string" } },
  ],
  get: proxyOperation(
    "Location Service",
    "Forward GET to Location Service",
    "get",
  ),
  post: proxyOperation(
    "Location Service",
    "Forward POST to Location Service",
    "post",
  ),
};

def.paths["/api/v1/assignment/{path}"] = {
  parameters: [
    { name: "path", in: "path", required: true, schema: { type: "string" } },
  ],
  get: proxyOperation(
    "Assignment Service",
    "Forward GET to Assignment Service",
    "get",
  ),
  post: proxyOperation(
    "Assignment Service",
    "Forward POST to Assignment Service",
    "post",
  ),
};

// Remove the placeholder refs (they were replaced above)
delete def.paths["/api/v1/rider/{path}"]["x-swagger-router-controller"];
delete def.components?.pathItems;

export const swaggerSpec = swaggerJsdoc(options);
