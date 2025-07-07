// src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DaoShop API',
            version: '1.0.0',
            description: `
# DaoShop API Documentation

Complete API documentation for the DaoShop e-commerce platform.

## Rate Limiting

This API implements rate limiting to protect against abuse:

- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Registration**: 3 registrations per hour
- **OTP**: 3 OTP requests per 10 minutes

When rate limit is exceeded, the API returns HTTP 429 (Too Many Requests) with retry information.
            `
        },
        servers: [
            {
                url: 'http://localhost:8797',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '64f123abc456def789012345' },
                        userName: { type: 'string', example: 'johndoe123' },
                        email: { type: 'string', example: 'john@example.com' },
                        isEmailVerified: { type: 'boolean', example: true }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '6856dd9d591b5fb9368174ff'
                        },
                        id: {
                            type: 'string',
                            example: 'BT1',
                            description: 'Mã sản phẩm duy nhất'
                        },
                        nameProduct: {
                            type: 'string',
                            example: 'Bông tai Vàng 10K đính đá ECZ PNJ Sunnyva XMXMY006000'
                        },
                        category: {
                            type: 'string',
                            example: 'TRANG SỨC',
                            description: 'Danh mục sản phẩm (viết hoa)'
                        },
                        type: {
                            type: 'string',
                            example: 'Bông tai',
                            description: 'Loại sản phẩm'
                        },
                        description: {
                            type: 'string',
                            example: '- Trọng lượng tham khảo: 16.03243 phân - Loại đá chính: Xoàn mỹ'
                        },
                        material: {
                            type: 'string',
                            example: 'Vàng'
                        },
                        karat: {
                            type: 'string',
                            example: '10K'
                        },
                        gender: {
                            type: 'string',
                            enum: ['Nam', 'Nữ', 'Unisex'],
                            example: 'Nữ'
                        },
                        productImg: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string',
                                format: 'uri'
                            },
                            example: {
                                "0": "https://example.com/image1.jpg",
                                "1": "https://example.com/image2.jpg"
                            }
                        },
                        sizePrice: {
                            type: 'object',
                            additionalProperties: {
                                $ref: '#/components/schemas/SizePrice'
                            },
                            example: {
                                "0": {
                                    "size": 0,
                                    "price": 9690000,
                                    "stock": 44
                                }
                            }
                        },
                        listComments: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string'
                            },
                            example: {
                                "0": "none"
                            }
                        },
                        listEvaluation: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string'
                            },
                            example: {
                                "0": "none"
                            }
                        },
                        show: {
                            type: 'string',
                            enum: ['true', 'false'],
                            example: 'true'
                        },
                        discountPercent: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            example: 10
                        },
                        totalSold: {
                            type: 'number',
                            minimum: 0,
                            example: 0
                        },
                        avgRating: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5,
                            example: 4.5
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-07-07T04:22:50.875Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-07-07T04:22:50.875Z'
                        }
                    },
                    required: ['id', 'nameProduct', 'category', 'type', 'description', 'material', 'karat', 'gender', 'productImg', 'sizePrice']
                },
                SizePrice: {
                    type: 'object',
                    properties: {
                        size: {
                            type: 'number',
                            example: 0,
                            description: 'Kích thước sản phẩm'
                        },
                        price: {
                            type: 'number',
                            minimum: 0,
                            example: 9690000,
                            description: 'Giá sản phẩm (VND)'
                        },
                        stock: {
                            type: 'number',
                            minimum: 0,
                            example: 44,
                            description: 'Số lượng tồn kho'
                        }
                    },
                    required: ['size', 'price', 'stock']
                },
                ProductsResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Product'
                            }
                        },
                        pagination: {
                            $ref: '#/components/schemas/Pagination'
                        }
                    }
                },
                ProductResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            $ref: '#/components/schemas/Product'
                        }
                    }
                },
                CategoriesResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['TRANG SỨC', 'TRANG SỨC CƯỚI']
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'number',
                            example: 100,
                            description: 'Tổng số sản phẩm'
                        },
                        page: {
                            type: 'number',
                            example: 1,
                            description: 'Trang hiện tại'
                        },
                        limit: {
                            type: 'number',
                            example: 10,
                            description: 'Số sản phẩm mỗi trang'
                        },
                        totalPages: {
                            type: 'number',
                            example: 10,
                            description: 'Tổng số trang'
                        }
                    }
                },
                CreateProductRequest: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'BT2',
                            description: 'Mã sản phẩm duy nhất'
                        },
                        nameProduct: {
                            type: 'string',
                            example: 'Bông tai Vàng 14K đính đá ECZ PNJ Test'
                        },
                        category: {
                            type: 'string',
                            example: 'TRANG SỨC'
                        },
                        type: {
                            type: 'string',
                            example: 'Bông tai'
                        },
                        description: {
                            type: 'string',
                            example: 'Mô tả sản phẩm test'
                        },
                        material: {
                            type: 'string',
                            example: 'Vàng'
                        },
                        karat: {
                            type: 'string',
                            example: '14K'
                        },
                        gender: {
                            type: 'string',
                            enum: ['Nam', 'Nữ', 'Unisex'],
                            example: 'Nữ'
                        },
                        productImg: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string',
                                format: 'uri'
                            },
                            example: {
                                "0": "https://example.com/image1.jpg",
                                "1": "https://example.com/image2.jpg"
                            }
                        },
                        sizePrice: {
                            type: 'object',
                            additionalProperties: {
                                $ref: '#/components/schemas/SizePrice'
                            },
                            example: {
                                "0": {
                                    "size": 0,
                                    "price": 5000000,
                                    "stock": 10
                                }
                            }
                        },
                        show: {
                            type: 'string',
                            enum: ['true', 'false'],
                            example: 'true'
                        }
                    },
                    required: ['id', 'nameProduct', 'category', 'type', 'description', 'material', 'karat', 'gender', 'productImg', 'sizePrice']
                },
                UpdateStockRequest: {
                    type: 'object',
                    properties: {
                        sizeIndex: {
                            type: 'string',
                            example: '0',
                            description: 'Index của size trong sizePrice object'
                        },
                        stock: {
                            type: 'number',
                            minimum: 0,
                            example: 50,
                            description: 'Số lượng tồn kho mới'
                        }
                    },
                    required: ['sizeIndex', 'stock']
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' }
                    }
                },
                RateLimitError: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Too many requests, please try again later'
                        },
                        retryAfter: {
                            type: 'number',
                            description: 'Số giây cần đợi trước khi thử lại',
                            example: 900
                        }
                    }
                }
            },
            responses: {
                RateLimitExceeded: {
                    description: 'Too Many Requests - Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RateLimitError'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js'] // Chỉ scan routes
};

const specs = swaggerJsdoc(options);

module.exports = {
    specs,
    swaggerUi
};