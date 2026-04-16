package main

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/google/uuid"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "person-crud-api/docs" // <--- THIS IS CRITICAL (change to your module name)
)

//
// go mod init person-crud-api
// go get github.com/gin-gonic/gin
// go get github.com/google/uuid
// go get github.com/swaggo/gin-swagger
// go get github.com/swaggo/files
// go get github.com/swaggo/swag/cmd/swag
// go get github.com/swaggo/gin-swagger
// go get github.com/swaggo/files
// go get github.com/swaggo/swag/cmd/swag
// swag init
// go run main.go


// Person represents a person in the system
type Person struct {
	ID      uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name    string    `json:"name" example:"John Doe" binding:"required"`
	Address string    `json:"address" example:"123 Main St" binding:"required"`
	City    string    `json:"city" example:"New York" binding:"required"`
	Zip     string    `json:"zip" example:"10001" binding:"required"`
	Phone   string    `json:"phone" example:"(555) 123-4567" binding:"required"`
}

// In-memory storage
var (
	people []Person
	mu     sync.RWMutex
)

type ErrorResponse struct {
	Error string `json:"error" example:"person not found"`
}

// General API info - swaggo reads these
// @title           Person CRUD API
// @version         1.0
// @description     Simple RESTful CRUD API built with Gin + in-memory storage
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    https://github.com/swaggo/gin-swagger
// @contact.email  support@example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1
// @schemes   http https
func main() {
	seedData()

	r := gin.Default()

	// Middleware
	r.Use(corsMiddleware())
	r.Use(sizeLimiterMiddleware())

	// Swagger with explicit URL (this prevents most 500 errors)
	url := ginSwagger.URL("/swagger/doc.json") // The URL pointing to API definition
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler, url))

	// API routes
	v1 := r.Group("/api/v1")
	{
		persons := v1.Group("/persons")
		{
			persons.GET("", getAllPersons)
			persons.POST("", createPerson)
			persons.GET("/:id", getPerson)
			persons.PUT("/:id", updatePerson)
			persons.PATCH("/:id", patchPerson)
			persons.DELETE("/:id", deletePerson)
		}
	}

	// Demo Gin features
	r.GET("/health", healthCheck)
	r.GET("/html", renderHTMLDemo)
	r.POST("/upload", uploadDemo)

	r.Run(":8080")
}

func seedData() {
	mu.Lock()
	defer mu.Unlock()

	id1, _ := uuid.NewRandom()
	id2, _ := uuid.NewRandom()

	people = append(people,
		Person{ID: id1, Name: "Alice Johnson", Address: "456 Oak Ave", City: "San Francisco", Zip: "94102", Phone: "(415) 555-0123"},
		Person{ID: id2, Name: "Bob Smith", Address: "789 Pine Rd", City: "Austin", Zip: "73301", Phone: "(512) 555-0456"},
	)
}

// ==================== Middleware ====================
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept-Encoding, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func sizeLimiterMiddleware() gin.HandlerFunc {
	const maxSize = 10 << 20 // 10MB
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		c.Next()
	}
}

// ==================== Handlers (with Swagger comments) ====================

// healthCheck godoc
// @Summary      Health check
// @Tags         health
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /health [get]
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "healthy", "version": "1.0"})
}

// getAllPersons godoc
// @Summary      Get all persons
// @Tags         persons
// @Produce      json
// @Param        limit  query  int  false  "Limit results"
// @Success      200   {array}   Person
// @Router       /api/v1/persons [get]
func getAllPersons(c *gin.Context) {
	mu.RLock()
	defer mu.RUnlock()
	_ = c.DefaultQuery("limit", "100")
	c.JSON(http.StatusOK, people)
}

// createPerson godoc
// @Summary      Create a new person
// @Tags         persons
// @Accept       json
// @Produce      json
// @Param        person  body      Person  true  "Person object"
// @Success      201     {object}  Person
// @Failure      400     {object}  ErrorResponse
// @Router       /api/v1/persons [post]
func createPerson(c *gin.Context) {
	var p Person
	if err := c.ShouldBindWith(&p, binding.JSON); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	p.ID = uuid.New()

	mu.Lock()
	people = append(people, p)
	mu.Unlock()

	c.JSON(http.StatusCreated, p)
}

// (The rest of the handlers remain the same as previous version - getPerson, updatePerson, patchPerson, deletePerson, renderHTMLDemo, uploadDemo)

func getPerson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid UUID"})
		return
	}

	mu.RLock()
	defer mu.RUnlock()
	for _, p := range people {
		if p.ID == id {
			c.JSON(http.StatusOK, p)
			return
		}
	}
	c.JSON(http.StatusNotFound, ErrorResponse{Error: "person not found"})
}

func updatePerson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid UUID"})
		return
	}

	var p Person
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	p.ID = id

	mu.Lock()
	defer mu.Unlock()
	for i, person := range people {
		if person.ID == id {
			people[i] = p
			c.JSON(http.StatusOK, p)
			return
		}
	}
	c.JSON(http.StatusNotFound, ErrorResponse{Error: "person not found"})
}

func patchPerson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid UUID"})
		return
	}

	var patch map[string]interface{}
	if err := c.ShouldBindJSON(&patch); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	mu.Lock()
	defer mu.Unlock()
	for i, p := range people {
		if p.ID == id {
			if v, ok := patch["name"].(string); ok && v != "" {
				p.Name = v
			}
			if v, ok := patch["address"].(string); ok && v != "" {
				p.Address = v
			}
			if v, ok := patch["city"].(string); ok && v != "" {
				p.City = v
			}
			if v, ok := patch["zip"].(string); ok && v != "" {
				p.Zip = v
			}
			if v, ok := patch["phone"].(string); ok && v != "" {
				p.Phone = v
			}
			people[i] = p
			c.JSON(http.StatusOK, p)
			return
		}
	}
	c.JSON(http.StatusNotFound, ErrorResponse{Error: "person not found"})
}

func deletePerson(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid UUID"})
		return
	}

	mu.Lock()
	defer mu.Unlock()
	for i, p := range people {
		if p.ID == id {
			people = append(people[:i], people[i+1:]...)
			c.Status(http.StatusNoContent)
			return
		}
	}
	c.JSON(http.StatusNotFound, ErrorResponse{Error: "person not found"})
}

func renderHTMLDemo(c *gin.Context) {
	c.HTML(http.StatusOK, "demo.html", gin.H{
		"title":   "Gin CRUD API",
		"message": "HTML rendering demo with Gin",
	})
}

func uploadDemo(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"filename": file.Filename, "size": file.Size, "status": "received"})
}
