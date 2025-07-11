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
        tags: [
            {
                name: 'Cart',
                description: 'Quản lý giỏ hàng - Cart management operations'
            },
            {
                name: 'Auth',
                description: 'Authentication & Authorization'
            },
            {
                name: 'Products',
                description: 'Product management'
            },
            {
                name: 'Collections',
                description: 'Collection management'
            },
            {
                name: 'Comments',
                description: 'Comment management'
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
                // src/docs/swagger.js - Thêm vào components.schemas
                Collection: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '686b8913e62f1c7ef9fa2522'
                        },
                        idColection: {
                            type: 'string',
                            example: 'Chót Mê',
                            description: 'ID bộ sưu tập duy nhất'
                        },
                        name: {
                            type: 'string',
                            example: 'Bộ sưu tập Chót mê'
                        },
                        urlImage: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://firebasestorage.googleapis.com/v0/b/duan-4904c.appspot.com/o/flutter_pnj%2FImage%20Home%2FImage%20B%E1%BB%99%20s%C6%B0u%20t%E1%BA%ADp%2FBosuutap_chotme.png?alt=media&token=26539cef-48e3-46ba-a576-be2d23957b5f'
                        },
                        listProduct: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string'
                            },
                            example: {
                                "0": "BT1",
                                "1": "BT2",
                                "2": "BT3"
                            }
                        },
                        description: {
                            type: 'string',
                            example: 'Mô tả bộ sưu tập'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        displayOrder: {
                            type: 'number',
                            example: 1
                        },
                        totalProducts: {
                            type: 'number',
                            example: 3
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
                    required: ['idColection', 'name', 'urlImage', 'listProduct']
                },
                CollectionsResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Collection'
                            }
                        },
                        pagination: {
                            $ref: '#/components/schemas/Pagination'
                        }
                    }
                },
                CollectionResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            $ref: '#/components/schemas/Collection'
                        }
                    }
                },
                CollectionProductsResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                collection: {
                                    type: 'object',
                                    properties: {
                                        idColection: { type: 'string', example: 'Chót Mê' },
                                        name: { type: 'string', example: 'Bộ sưu tập Chót mê' },
                                        urlImage: { type: 'string', format: 'uri' },
                                        description: { type: 'string', example: 'Mô tả bộ sưu tập' },
                                        totalProducts: { type: 'number', example: 3 }
                                    }
                                },
                                products: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Product'
                                    }
                                }
                            }
                        }
                    }
                },
                CreateCollectionRequest: {
                    type: 'object',
                    properties: {
                        idColection: {
                            type: 'string',
                            example: 'New Collection',
                            description: 'ID bộ sưu tập duy nhất'
                        },
                        name: {
                            type: 'string',
                            example: 'Bộ sưu tập mới'
                        },
                        urlImage: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/collection-image.jpg'
                        },
                        listProduct: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string'
                            },
                            example: {
                                "0": "BT1",
                                "1": "BT2"
                            }
                        },
                        description: {
                            type: 'string',
                            example: 'Mô tả bộ sưu tập mới'
                        },
                        displayOrder: {
                            type: 'number',
                            example: 1
                        }
                    },
                    required: ['idColection', 'name', 'urlImage', 'listProduct']
                },
                // Thêm vào components.schemas nếu chưa có:

                UpdateCollectionRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Bộ sưu tập Chót mê updated'
                        },
                        description: {
                            type: 'string',
                            example: 'Mô tả đã được cập nhật'
                        },
                        urlImage: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/new-image.jpg'
                        },
                        displayOrder: {
                            type: 'number',
                            example: 1
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        listProduct: {
                            type: 'object',
                            additionalProperties: {
                                type: 'string'
                            },
                            example: {
                                "0": "BT1",
                                "1": "BT2",
                                "2": "BT3"
                            }
                        }
                    }
                },
                AddProductRequest: {
                    type: 'object',
                    properties: {
                        productId: {
                            type: 'string',
                            example: 'BT1',
                            description: 'ID sản phẩm cần thêm vào bộ sưu tập'
                        }
                    },
                    required: ['productId']
                },
                Comment: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '686bfe5b26f7c937487230e3'
                        },
                        content: {
                            type: 'string',
                            example: 'sản phẩm tốt',
                            minLength: 1,
                            maxLength: 1000
                        },
                        hasFix: {
                            type: 'string',
                            enum: ['true', 'false'],
                            example: 'false'
                        },
                        idProduct: {
                            type: 'string',
                            example: 'BT1'
                        },
                        idUser: {
                            type: 'string',
                            example: 'g5ddiB1d91etU1xWZXwlUQRokcG3'
                        },
                        nameUser: {
                            type: 'string',
                            example: 'Nguyen Dao'
                        },
                        timeComment: {
                            type: 'string',
                            example: 'March 14, 2025 at 10:22:36 PM UTC+7'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        likes: {
                            type: 'number',
                            example: 5
                        },
                        likedBy: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['userId1', 'userId2']
                        },
                        replies: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    content: { type: 'string', example: 'Cảm ơn bạn!' },
                                    userId: { type: 'string', example: 'adminUserId' },
                                    userName: { type: 'string', example: 'Admin' },
                                    timeReply: { type: 'string', example: 'March 15, 2025 at 9:00:00 AM UTC+7' },
                                    isActive: { type: 'boolean', example: true }
                                }
                            }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    },
                    required: ['content', 'idProduct', 'idUser', 'nameUser', 'timeComment']
                },

                CommentsResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Comment'
                            }
                        },
                        pagination: {
                            $ref: '#/components/schemas/Pagination'
                        }
                    }
                },

                CommentResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            $ref: '#/components/schemas/Comment'
                        }
                    }
                },

                CreateCommentRequest: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            example: 'Sản phẩm rất đẹp và chất lượng!',
                            minLength: 1,
                            maxLength: 1000
                        },
                        idProduct: {
                            type: 'string',
                            example: 'BT1'
                        },
                        idUser: {
                            type: 'string',
                            example: 'g5ddiB1d91etU1xWZXwlUQRokcG3'
                        },
                        nameUser: {
                            type: 'string',
                            example: 'Nguyen Dao'
                        }
                    },
                    required: ['content', 'idProduct', 'idUser', 'nameUser']
                },

                UpdateCommentRequest: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            example: 'Sản phẩm rất đẹp và chất lượng! (đã chỉnh sửa)',
                            minLength: 1,
                            maxLength: 1000
                        },
                        userId: {
                            type: 'string',
                            example: 'g5ddiB1d91etU1xWZXwlUQRokcG3'
                        }
                    },
                    required: ['content', 'userId']
                },

                CreateReplyRequest: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            example: 'Cảm ơn bạn đã chia sẻ!',
                            minLength: 1,
                            maxLength: 500
                        },
                        userId: {
                            type: 'string',
                            example: 'adminUserId'
                        },
                        userName: {
                            type: 'string',
                            example: 'Admin Shop'
                        }
                    },
                    required: ['content', 'userId', 'userName']
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
                },
                CartItem: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '64f123abc456def789012345'
                        },
                        productId: {
                            type: 'string',
                            example: 'BT1',
                            description: 'ID sản phẩm'
                        },
                        sizeIndex: {
                            type: 'number',
                            minimum: 0,
                            example: 0,
                            description: 'Chỉ số size trong sizePrice array'
                        },
                        quantity: {
                            type: 'number',
                            minimum: 1,
                            example: 2,
                            description: 'Số lượng sản phẩm'
                        },
                        price: {
                            type: 'number',
                            minimum: 0,
                            example: 250000,
                            description: 'Giá sản phẩm tại thời điểm thêm vào cart (VND)'
                        },
                        addedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-07-11T08:30:00.000Z',
                            description: 'Thời gian thêm vào giỏ hàng'
                        }
                    },
                    required: ['productId', 'sizeIndex', 'quantity', 'price']
                },

                Cart: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '64f123abc456def789012345'
                        },
                        userId: {
                            type: 'string',
                            example: '6870c70c1ca5164be10bb91d',
                            description: 'ID người dùng sở hữu giỏ hàng'
                        },
                        items: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/CartItem'
                            },
                            description: 'Danh sách sản phẩm trong giỏ hàng'
                        },
                        totalAmount: {
                            type: 'number',
                            minimum: 0,
                            example: 500000,
                            description: 'Tổng tiền giỏ hàng (VND)'
                        },
                        totalItems: {
                            type: 'number',
                            minimum: 0,
                            example: 2,
                            description: 'Tổng số loại sản phẩm trong giỏ hàng'
                        },
                        lastUpdated: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-07-11T08:30:00.000Z',
                            description: 'Thời gian cập nhật cuối cùng'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-07-11T08:00:00.000Z'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-07-11T08:30:00.000Z'
                        }
                    },
                    required: ['userId', 'items', 'totalAmount', 'totalItems']
                },

                CartResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            $ref: '#/components/schemas/Cart'
                        },
                        message: {
                            type: 'string',
                            example: 'Cart retrieved successfully'
                        }
                    }
                },

                AddToCartRequest: {
                    type: 'object',
                    properties: {
                        productId: {
                            type: 'string',
                            example: 'BT1',
                            description: 'ID sản phẩm cần thêm'
                        },
                        sizeIndex: {
                            type: 'number',
                            minimum: 0,
                            example: 0,
                            description: 'Chỉ số size trong sizePrice (0, 1, 2, ...)'
                        },
                        quantity: {
                            type: 'number',
                            minimum: 1,
                            example: 1,
                            description: 'Số lượng cần thêm'
                        }
                    },
                    required: ['productId', 'sizeIndex', 'quantity']
                },

                UpdateCartRequest: {
                    type: 'object',
                    properties: {
                        productId: {
                            type: 'string',
                            example: 'BT1',
                            description: 'ID sản phẩm cần cập nhật'
                        },
                        sizeIndex: {
                            type: 'number',
                            minimum: 0,
                            example: 0,
                            description: 'Chỉ số size trong sizePrice'
                        },
                        quantity: {
                            type: 'number',
                            minimum: 1,
                            example: 3,
                            description: 'Số lượng mới'
                        }
                    },
                    required: ['productId', 'sizeIndex', 'quantity']
                },
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