export default {
    metadata: {
        columns: [
            {
                roles: {
                    id: true
                },
                type: {
                    underlyingType: 260,
                    category: null
                },
                format: "0",
                displayName: "article_id",
                queryName: "documents.article_id",
                expr: {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "article_id"
                }
            },
            {
                "roles": {
                    "title": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "title",
                "queryName": "documents.title",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "title"
                }
            },
            {
                "roles": {
                    "content": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "content",
                "queryName": "documents.content",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "content"
                }
            },
            {
                "roles": {
                    "summary": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "summary",
                "queryName": "documents.summary",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "summary"
                }
            },
            {
                "roles": {
                    "imageUrl": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "main_image",
                "queryName": "documents.main_image",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "main_image"
                }
            },
            {
                "roles": {
                    "author": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": " author",
                "queryName": "documents. author",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": " author"
                }
            },
            {
                "roles": {
                    "articleDate": true
                },
                "type": {
                    "underlyingType": 519,
                    "category": null,
                    "temporalType": {
                        "underlyingType": 519
                    }
                },
                "format": "dddd\\, MMMM %d\\, yyyy",
                "displayName": "source_date",
                "queryName": "documents.source_date",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "source_date"
                }
            },
            {
                "roles": {
                    "sourceImage": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "source_image",
                "queryName": "documents.source_image",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "source_image"
                }
            },
            {
                "roles": {
                    "sourceUrl": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "source_url",
                "queryName": "documents.source_url",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "source_url"
                }
            },
            {
                "roles": {
                    "source": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "source_domain",
                "queryName": "documents.source_domain",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documents"
                    },
                    "ref": "source_domain"
                }
            },
            {
                "roles": {
                    "entityType": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "facet",
                "queryName": "concepts.facet",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "concepts"
                    },
                    "ref": "facet"
                }
            },
            {
                "roles": {
                    "entityName": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "facet_instance",
                "queryName": "concepts.facet_instance",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "concepts"
                    },
                    "ref": "facet_instance"
                }
            },
            {
                "roles": {
                    "entityPosition": true
                },
                "type": {
                    "underlyingType": 259,
                    "category": null
                },
                "displayName": "first_position",
                "queryName": "documentConcepts.first_position",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "documentConcepts"
                    },
                    "ref": "first_position"
                }
            },
            {
                "roles": {
                    "entityTypeColor": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "color",
                "queryName": "conceptsColors.color",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "conceptsColors"
                    },
                    "ref": "color"
                }
            },
            {
                "roles": {
                    "entityTypeClass": true
                },
                "type": {
                    "underlyingType": 1,
                    "category": null
                },
                "displayName": "class",
                "queryName": "conceptsColors.class",
                "expr": {
                    "_kind": 2,
                    "source": {
                        "_kind": 0,
                        "entity": "conceptsColors"
                    },
                    "ref": "class"
                }
            },
            {
                "roles": {
                    "articleValue": true
                },
                "type": {
                    "underlyingType": 260,
                    "category": null
                },
                "displayName": "Count of article_id",
                "queryName": "CountNonNull(documentConcepts.article_id)",
                "expr": {
                    "_kind": 4,
                    "arg": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documentConcepts"
                        },
                        "ref": "article_id"
                    },
                    "func": 5
                }
            }
        ],
        objects: {
            "presentation": {
                "wrap": true
            }
        }
    },
    categorical: {
        categories: [
            {
                "source": {
                    "roles": {
                        "id": true
                    },
                    "type": {
                        "underlyingType": 260,
                        "category": null
                    },
                    "format": "0",
                    "displayName": "article_id",
                    "queryName": "documents.article_id",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "article_id"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "title": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "title",
                    "queryName": "documents.title",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "title"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "summary": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "summary",
                    "queryName": "documents.summary",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "summary"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "content": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "content",
                    "queryName": "documents.content",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "content"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "imageUrl": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "main_image",
                    "queryName": "documents.main_image",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "main_image"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "author": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": " author",
                    "queryName": "documents. author",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": " author"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "source": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "source_domain",
                    "queryName": "documents.source_domain",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "source_domain"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "sourceUrl": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "source_url",
                    "queryName": "documents.source_url",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "source_url"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "sourceImage": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "source_image",
                    "queryName": "documents.source_image",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "source_image"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "articleDate": true
                    },
                    "type": {
                        "underlyingType": 519,
                        "category": null,
                        "temporalType": {
                            "underlyingType": 519
                        }
                    },
                    "format": "dddd\\, MMMM %d\\, yyyy",
                    "displayName": "source_date",
                    "queryName": "documents.source_date",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documents"
                        },
                        "ref": "source_date"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "entityType": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "facet",
                    "queryName": "concepts.facet",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "concepts"
                        },
                        "ref": "facet"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "entityName": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "facet_instance",
                    "queryName": "concepts.facet_instance",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "concepts"
                        },
                        "ref": "facet_instance"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "entityPosition": true
                    },
                    "type": {
                        "underlyingType": 259,
                        "category": null
                    },
                    "displayName": "first_position",
                    "queryName": "documentConcepts.first_position",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documentConcepts"
                        },
                        "ref": "first_position"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "entityTypeColor": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "color",
                    "queryName": "conceptsColors.color",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "conceptsColors"
                        },
                        "ref": "color"
                    }
                }
            },
            {
                "source": {
                    "roles": {
                        "entityTypeClass": true
                    },
                    "type": {
                        "underlyingType": 1,
                        "category": null
                    },
                    "displayName": "class",
                    "queryName": "conceptsColors.class",
                    "expr": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "conceptsColors"
                        },
                        "ref": "class"
                    }
                }
            }
        ],
        values: [ {
            "source": {
                "roles": {
                    "articleValue": true
                },
                "type": {
                    "underlyingType": 260,
                    "category": null
                },
                "displayName": "Count of article_id",
                "queryName": "CountNonNull(documentConcepts.article_id)",
                "expr": {
                    "_kind": 4,
                    "arg": {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "documentConcepts"
                        },
                        "ref": "article_id"
                    },
                    "func": 5
                }
            }
        }
        ]
    }
}