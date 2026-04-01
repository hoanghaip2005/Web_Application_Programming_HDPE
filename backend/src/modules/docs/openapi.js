import { env } from "../../config/env.js";

const serverUrl = env.appBaseUrl || `http://localhost:${env.port}`;

const jsonContent = {
  "application/json": {
    schema: {
      type: "object",
      properties: {
        data: {
          oneOf: [
            { type: "object", additionalProperties: true },
            { type: "array", items: { type: "object", additionalProperties: true } }
          ]
        },
        message: { type: "string" },
        details: {}
      }
    }
  }
};

const uuidSchema = {
  type: "string",
  format: "uuid"
};

const nullableUuidSchema = {
  ...uuidSchema,
  nullable: true
};

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "HDPE Board Game Platform API",
    version: "1.0.0",
    description:
      "OpenAPI specification for the HDPE board game platform backend. The UI is served by Swagger UI."
  },
  servers: [
    {
      url: serverUrl,
      description: "Current backend server"
    }
  ],
  tags: [
    { name: "Health", description: "Service availability" },
    { name: "Auth", description: "Registration and login" },
    { name: "Profile", description: "Current user profile" },
    { name: "Users", description: "User search" },
    { name: "Friends", description: "Friendship management" },
    { name: "Messages", description: "Conversations and messages" },
    { name: "Achievements", description: "Achievement catalog and progress" },
    { name: "Ranking", description: "Game rankings" },
    { name: "Games", description: "Games catalog, reviews, saves and results" },
    { name: "Admin", description: "Administrative endpoints" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          details: {}
        }
      },
      SessionUser: {
        type: "object",
        properties: {
          userId: { ...uuidSchema },
          email: { type: "string", format: "email" },
          username: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          status: { type: "string", enum: ["active", "disabled"] }
        }
      },
      AuthSession: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/SessionUser" }
        }
      },
      Profile: {
        type: "object",
        properties: {
          userId: { ...uuidSchema },
          email: { type: "string", format: "email" },
          username: { type: "string" },
          role: { type: "string" },
          status: { type: "string" },
          displayName: { type: "string", nullable: true },
          avatarUrl: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          city: { type: "string", nullable: true }
        }
      },
      Friend: {
        type: "object",
        properties: {
          userId: { ...uuidSchema },
          username: { type: "string" },
          displayName: { type: "string", nullable: true },
          avatarUrl: { type: "string", nullable: true }
        }
      },
      Friendship: {
        type: "object",
        properties: {
          friendshipId: { ...uuidSchema },
          status: { type: "string" },
          requestedAt: { type: "string", format: "date-time", nullable: true },
          respondedAt: { type: "string", format: "date-time", nullable: true },
          isRequester: { type: "boolean" },
          friend: { $ref: "#/components/schemas/Friend" }
        }
      },
      ConversationMember: {
        type: "object",
        properties: {
          userId: { ...uuidSchema },
          username: { type: "string" },
          displayName: { type: "string", nullable: true }
        }
      },
      ConversationSummary: {
        type: "object",
        properties: {
          conversationId: { ...uuidSchema },
          conversationType: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          latestMessageAt: { type: "string", format: "date-time", nullable: true },
          latestMessagePreview: { type: "string", nullable: true },
          unreadCount: { type: "integer" },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/ConversationMember" }
          }
        }
      },
      Message: {
        type: "object",
        properties: {
          messageId: { ...uuidSchema },
          senderId: { ...uuidSchema },
          senderUsername: { type: "string" },
          messageBody: { type: "string" },
          sentAt: { type: "string", format: "date-time" }
        }
      },
      ConversationDetail: {
        type: "object",
        properties: {
          conversationId: { ...uuidSchema },
          conversationType: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/ConversationMember" }
          },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/Message" }
          }
        }
      },
      Achievement: {
        type: "object",
        properties: {
          achievementId: { ...uuidSchema },
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          points: { type: "integer" },
          unlockedAt: { type: "string", format: "date-time", nullable: true },
          progressValue: { type: "integer", nullable: true }
        }
      },
      RankingRow: {
        type: "object",
        properties: {
          userId: { ...nullableUuidSchema },
          username: { type: "string" },
          totalScore: { type: "integer" },
          totalMatches: { type: "integer" },
          winsCount: { type: "integer" }
        }
      },
      GameInstruction: {
        type: "object",
        properties: {
          instructionId: { ...uuidSchema },
          title: { type: "string" },
          content: { type: "string" },
          version: { type: "integer" }
        }
      },
      Game: {
        type: "object",
        properties: {
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          isEnabled: { type: "boolean" },
          defaultBoardRows: { type: "integer" },
          defaultBoardCols: { type: "integer" },
          defaultTimerSeconds: { type: "integer" },
          supportsSaveLoad: { type: "boolean" },
          supportsRating: { type: "boolean" },
          supportsComment: { type: "boolean" },
          displayOrder: { type: "integer" },
          instructions: {
            type: "array",
            items: { $ref: "#/components/schemas/GameInstruction" }
          }
        }
      },
      ReviewSummary: {
        type: "object",
        properties: {
          averageRating: { type: "number" },
          totalRatings: { type: "integer" },
          reviews: {
            type: "array",
            items: {
              type: "object",
              properties: {
                commentId: { ...uuidSchema },
                commentBody: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                ratingValue: { type: "integer", nullable: true },
                user: {
                  type: "object",
                  properties: {
                    userId: { ...uuidSchema },
                    username: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      SavedGame: {
        type: "object",
        nullable: true,
        properties: {
          saveId: { ...uuidSchema },
          boardState: { type: "object", additionalProperties: true },
          gameState: { type: "object", additionalProperties: true },
          score: { type: "integer" },
          elapsedSeconds: { type: "integer" },
          remainingSeconds: { type: "integer", nullable: true },
          savedAt: { type: "string", format: "date-time" }
        }
      },
      GameResultReceipt: {
        type: "object",
        properties: {
          resultId: { ...uuidSchema },
          sessionId: { ...uuidSchema },
          outcome: { type: "string" },
          finalScore: { type: "integer" },
          completedAt: { type: "string", format: "date-time" }
        }
      },
      AdminOverview: {
        type: "object",
        properties: {
          totalUsers: { type: "integer" },
          activeUsers: { type: "integer" },
          disabledUsers: { type: "integer" },
          totalGames: { type: "integer" },
          totalResults: { type: "integer" },
          databaseConnected: { type: "boolean" },
          httpsReady: { type: "boolean" },
          topGame: {
            type: "object",
            nullable: true,
            properties: {
              name: { type: "string" },
              totalResults: { type: "integer" }
            }
          }
        }
      },
      AdminUserListItem: {
        type: "object",
        properties: {
          userId: { ...uuidSchema },
          email: { type: "string" },
          username: { type: "string" },
          status: { type: "string" },
          role: { type: "string" },
          displayName: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      AdminUserDetail: {
        type: "object",
        properties: {
          userId: { ...uuidSchema },
          email: { type: "string" },
          username: { type: "string" },
          status: { type: "string" },
          role: { type: "string" },
          displayName: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          avatarUrl: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          metrics: {
            type: "object",
            properties: {
              totalFriends: { type: "integer" },
              totalConversations: { type: "integer" },
              totalResults: { type: "integer" },
              totalRatings: { type: "integer" },
              totalAchievements: { type: "integer" }
            }
          }
        }
      },
      AdminUserStatistics: {
        type: "object",
        properties: {
          byRole: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                total: { type: "integer" }
              }
            }
          },
          byStatus: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                total: { type: "integer" }
              }
            }
          },
          recentUsers: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminUserListItem" }
          }
        }
      },
      AdminGameStatisticsRow: {
        type: "object",
        properties: {
          code: { type: "string" },
          name: { type: "string" },
          totalResults: { type: "integer" },
          totalPlayers: { type: "integer" },
          totalRatings: { type: "integer" },
          totalComments: { type: "integer" },
          averageRating: { type: "number" }
        }
      },
      PaginatedAdminUsers: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminUserListItem" }
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              pageSize: { type: "integer" },
              totalItems: { type: "integer" },
              totalPages: { type: "integer" }
            }
          },
          filters: {
            type: "object",
            properties: {
              query: { type: "string" },
              status: { type: "string" },
              role: { type: "string" }
            }
          }
        }
      },
      ManagedAchievement: {
        type: "object",
        properties: {
          achievementId: { ...uuidSchema },
          gameId: { ...nullableUuidSchema },
          gameCode: { type: "string", nullable: true },
          gameName: { type: "string" },
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          points: { type: "integer" },
          conditionType: { type: "string", enum: ["wins", "score", "colored_cells"] },
          conditionLabel: { type: "string" },
          conditionValue: { type: "integer" },
          isActive: { type: "boolean" },
          unlockedUsers: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      ManagedAchievementFilters: {
        type: "object",
        properties: {
          query: { type: "string" },
          status: { type: "string", enum: ["active", "inactive"] },
          gameCode: { type: "string" }
        }
      },
      ManagedAchievementCollection: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/ManagedAchievement" }
          },
          filters: { $ref: "#/components/schemas/ManagedAchievementFilters" }
        }
      },
      ManagedAchievementCreateRequest: {
        type: "object",
        required: ["gameCode", "code", "name", "description", "points", "conditionType", "conditionValue"],
        properties: {
          gameCode: { type: "string" },
          code: { type: "string", example: "snake-score-120" },
          name: { type: "string" },
          description: { type: "string" },
          points: { type: "integer" },
          conditionType: { type: "string", enum: ["wins", "score", "colored_cells"] },
          conditionValue: { type: "integer" },
          isActive: { type: "boolean" }
        }
      },
      ManagedAchievementUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          points: { type: "integer" },
          conditionValue: { type: "integer" },
          isActive: { type: "boolean" }
        }
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Service health payload",
            content: jsonContent
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", example: "player_one" },
                  email: { type: "string", format: "email", example: "player@example.com" },
                  password: { type: "string", example: "Secret123" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Authenticated session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AuthSession" }
                  }
                }
              }
            }
          },
          400: { description: "Validation error", content: jsonContent },
          409: { description: "Duplicate email or username", content: jsonContent }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login by email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Authenticated session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AuthSession" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid credentials", content: jsonContent },
          403: { description: "Disabled account", content: jsonContent }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current session user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/SessionUser" }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: "Missing or invalid token", content: jsonContent }
        }
      }
    },
    "/api/profile/me": {
      get: {
        tags: ["Profile"],
        summary: "Get current profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Profile" }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Profile"],
        summary: "Update current profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string" },
                  bio: { type: "string" },
                  city: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Updated profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Profile" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/profile/avatar": {
      post: {
        tags: ["Profile"],
        summary: "Upload avatar to Supabase Storage",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fileName", "contentType", "base64Data"],
                properties: {
                  fileName: { type: "string" },
                  contentType: { type: "string", example: "image/png" },
                  base64Data: { type: "string", description: "Base64 string or data URL" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Profile with updated avatar",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Profile" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/users/search": {
      get: {
        tags: ["Users"],
        summary: "Search users",
        parameters: [
          {
            name: "q",
            in: "query",
            schema: { type: "string" },
            required: false,
            description: "Username or display name query"
          }
        ],
        responses: {
          200: {
            description: "Matching users",
            content: jsonContent
          }
        }
      }
    },
    "/api/friends": {
      get: {
        tags: ["Friends"],
        summary: "List accepted friends",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Friends list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Friendship" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/friends/requests": {
      get: {
        tags: ["Friends"],
        summary: "List pending friendship requests",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Pending requests",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Friendship" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Friends"],
        summary: "Send friendship request",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["targetUserId"],
                properties: {
                  targetUserId: { ...uuidSchema }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Request created", content: jsonContent }
        }
      }
    },
    "/api/friends/requests/{friendshipId}": {
      patch: {
        tags: ["Friends"],
        summary: "Accept or reject a friendship request",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "friendshipId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["action"],
                properties: {
                  action: { type: "string", enum: ["accept", "reject"] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Updated pending requests", content: jsonContent }
        }
      }
    },
    "/api/friends/{friendshipId}": {
      delete: {
        tags: ["Friends"],
        summary: "Remove friendship",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "friendshipId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        responses: {
          200: { description: "Updated friends list", content: jsonContent }
        }
      }
    },
    "/api/messages/conversations": {
      get: {
        tags: ["Messages"],
        summary: "List conversations",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Conversation summaries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ConversationSummary" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/messages/conversations/direct": {
      post: {
        tags: ["Messages"],
        summary: "Create or get direct conversation",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["friendUserId"],
                properties: {
                  friendUserId: { ...uuidSchema }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Conversation detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ConversationDetail" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/messages/conversations/{conversationId}": {
      get: {
        tags: ["Messages"],
        summary: "Get conversation detail",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "conversationId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        responses: {
          200: {
            description: "Conversation detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ConversationDetail" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Messages"],
        summary: "Send a message",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "conversationId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["messageBody"],
                properties: {
                  messageBody: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Conversation detail after new message",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ConversationDetail" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/achievements": {
      get: {
        tags: ["Achievements"],
        summary: "List active achievements",
        responses: {
          200: {
            description: "Achievement catalog",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Achievement" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/achievements/me": {
      get: {
        tags: ["Achievements"],
        summary: "List achievements for current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Achievement progress",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Achievement" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ranking/{gameCode}": {
      get: {
        tags: ["Ranking"],
        summary: "Get ranking by game",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "scope",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["global", "friends", "personal"] }
          }
        ],
        responses: {
          200: {
            description: "Ranking rows",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/RankingRow" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/games": {
      get: {
        tags: ["Games"],
        summary: "List games",
        responses: {
          200: {
            description: "Games catalog",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Game" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/games/{gameCode}": {
      get: {
        tags: ["Games"],
        summary: "Get game by code",
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Game detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Game" }
                  }
                }
              }
            }
          },
          404: { description: "Game not found", content: jsonContent }
        }
      }
    },
    "/api/games/{gameCode}/reviews": {
      get: {
        tags: ["Games"],
        summary: "Get game reviews",
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Reviews summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ReviewSummary" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Games"],
        summary: "Create or update a review",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ratingValue"],
                properties: {
                  ratingValue: { type: "integer", minimum: 1, maximum: 5 },
                  commentBody: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Updated reviews summary",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ReviewSummary" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/games/{gameCode}/save": {
      get: {
        tags: ["Games"],
        summary: "Get latest saved game",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Saved game or null",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/SavedGame" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Games"],
        summary: "Save current game state",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  boardState: { type: "object", additionalProperties: true },
                  gameState: { type: "object", additionalProperties: true },
                  score: { type: "integer" },
                  elapsedSeconds: { type: "integer" },
                  remainingSeconds: { type: "integer", nullable: true }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Saved game",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/SavedGame" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/games/{gameCode}/results": {
      post: {
        tags: ["Games"],
        summary: "Submit a game result",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["outcome"],
                properties: {
                  outcome: {
                    type: "string",
                    enum: ["win", "lose", "draw", "timeout", "abandoned"]
                  },
                  finalScore: { type: "integer" },
                  durationSeconds: { type: "integer", nullable: true },
                  movesCount: { type: "integer", nullable: true },
                  timeLimitSeconds: { type: "integer", nullable: true },
                  remainingSeconds: { type: "integer", nullable: true },
                  opponentType: { type: "string", example: "computer" },
                  boardState: { type: "object", additionalProperties: true },
                  gameState: { type: "object", additionalProperties: true },
                  metadata: { type: "object", additionalProperties: true }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Result receipt",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/GameResultReceipt" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/statistics/overview": {
      get: {
        tags: ["Admin"],
        summary: "Get system overview",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        responses: {
          200: {
            description: "Admin overview",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AdminOverview" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/statistics/games": {
      get: {
        tags: ["Admin"],
        summary: "Get per-game statistics",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        responses: {
          200: {
            description: "Per-game statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AdminGameStatisticsRow" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/statistics/users": {
      get: {
        tags: ["Admin"],
        summary: "Get user statistics",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        responses: {
          200: {
            description: "User statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AdminUserStatistics" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/achievements": {
      get: {
        tags: ["Admin"],
        summary: "List managed achievements",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive"] } },
          { name: "gameCode", in: "query", schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Managed achievement list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ManagedAchievementCollection" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "Create an achievement",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ManagedAchievementCreateRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Created achievement",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ManagedAchievement" }
                  }
                }
              }
            }
          },
          400: { description: "Validation error", content: jsonContent },
          404: { description: "Game not found", content: jsonContent },
          409: { description: "Achievement code already exists", content: jsonContent }
        }
      }
    },
    "/api/admin/achievements/{achievementId}": {
      patch: {
        tags: ["Admin"],
        summary: "Update an achievement",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        parameters: [
          {
            name: "achievementId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ManagedAchievementUpdateRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Updated achievement",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ManagedAchievement" }
                  }
                }
              }
            }
          },
          400: { description: "Validation error", content: jsonContent },
          404: { description: "Achievement not found", content: jsonContent }
        }
      }
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get paginated users list",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "disabled"] } },
          { name: "role", in: "query", schema: { type: "string", enum: ["user", "admin"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "Paginated users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PaginatedAdminUsers" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/users/{userId}": {
      get: {
        tags: ["Admin"],
        summary: "Get user detail",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        responses: {
          200: {
            description: "User detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AdminUserDetail" }
                  }
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ["Admin"],
        summary: "Update user status or role",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { ...uuidSchema }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["active", "disabled"] },
                  roleCode: { type: "string", enum: ["user", "admin"] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Updated user detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AdminUserDetail" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/games": {
      get: {
        tags: ["Admin"],
        summary: "Get managed games",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        responses: {
          200: {
            description: "Managed games",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Game" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/games/{gameCode}": {
      patch: {
        tags: ["Admin"],
        summary: "Update managed game configuration",
        security: [{ bearerAuth: [], apiKeyAuth: [] }],
        parameters: [
          {
            name: "gameCode",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  isEnabled: { type: "boolean" },
                  defaultBoardRows: { type: "integer" },
                  defaultBoardCols: { type: "integer" },
                  defaultTimerSeconds: { type: "integer" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Updated game",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Game" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
