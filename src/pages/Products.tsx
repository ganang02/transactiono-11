
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Barcode,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui-custom/GlassCard";
import { products as initialProducts, formatCurrency } from "@/data/mockData";
import { SlideUpTransition } from "@/hooks/useTransition";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

// Helper to save and load from localStorage
const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'pos-app-products'
};

const Products = () => {
  const [search, setSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    barcode: "",
    stock: "",
    category: ""
  });

  // Load products from localStorage on initial render
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const savedProducts = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
        
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          setProducts(parsedProducts);
          setFilteredProducts(parsedProducts);
        } else {
          // Use initial data if nothing in localStorage
          setProducts(initialProducts);
          setFilteredProducts(initialProducts);
          // Save initial data to localStorage
          localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast({
          title: "Failed to load products",
          description: "An error occurred while loading products",
          variant: "destructive",
        });
        // Fallback to initial data
        setProducts(initialProducts);
        setFilteredProducts(initialProducts);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const saveProducts = async (updatedProducts) => {
    setIsSaving(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
      
      toast({
        title: "Products saved",
        description: "Products have been saved successfully",
      });
    } catch (error) {
      console.error("Error saving products:", error);
      toast({
        title: "Failed to save products",
        description: "An error occurred while saving products",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearch(searchTerm);
    
    if (searchTerm === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.barcode.includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
      setFilteredProducts(filtered);
    }
  };

  const handleSort = (field: "name" | "price" | "stock") => {
    let order: "asc" | "desc" = "asc";
    
    if (sortField === field) {
      if (sortOrder === "asc") {
        order = "desc";
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
        setFilteredProducts([...products]);
        return;
      }
    }
    
    setSortField(field);
    setSortOrder(order);
    
    const sorted = [...filteredProducts].sort((a, b) => {
      if (field === "name") {
        return order === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (field === "price") {
        return order === "asc" ? a.price - b.price : b.price - a.price;
      } else {
        return order === "asc" ? a.stock - b.stock : b.stock - a.stock;
      }
    });
    
    setFilteredProducts(sorted);
  };

  const handleAddProduct = () => {
    // Validate form
    if (!newProduct.name || !newProduct.price || !newProduct.barcode || !newProduct.stock || !newProduct.category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Check if barcode already exists
    if (products.some(product => product.barcode === newProduct.barcode)) {
      toast({
        title: "Duplicate barcode",
        description: "A product with this barcode already exists",
        variant: "destructive",
      });
      return;
    }
    
    // Create new product
    const newProductObj = {
      id: Math.random().toString(36).substring(2, 9),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      barcode: newProduct.barcode,
      stock: parseInt(newProduct.stock),
      category: newProduct.category,
      image: null // No image, we're using icons now
    };
    
    // Update state and save to localStorage
    const updatedProducts = [...products, newProductObj];
    setProducts(updatedProducts);
    setFilteredProducts(updatedProducts);
    saveProducts(updatedProducts);
    
    // Reset form and close modal
    setNewProduct({
      name: "",
      price: "",
      barcode: "",
      stock: "",
      category: ""
    });
    setShowAddProduct(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };

  const handleDeleteProduct = (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      saveProducts(updatedProducts);
    }
  };

  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center mb-6 mt-6">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={handleSearch}
            className="pl-9 w-full bg-background/50 backdrop-blur-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button onClick={() => setShowAddProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => saveProducts(products)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-1" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
            <span className="ml-3">Loading products...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort("name")}>
                      Product
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "name" ? "text-primary" : ""}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Category</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Barcode</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-sm">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSort("price")}>
                      Price
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "price" ? "text-primary" : ""}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-sm">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSort("stock")}>
                      Stock
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "stock" ? "text-primary" : ""}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <SlideUpTransition key={product.id} show={true} duration={300 + index * 30}>
                      <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-primary/10 mr-3 flex-shrink-0 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{product.category}</td>
                        <td className="py-3 px-4 text-sm font-mono">{product.barcode}</td>
                        <td className="py-3 px-4 text-right text-sm">{formatCurrency(product.price)}</td>
                        <td className="py-3 px-4 text-right text-sm">{product.stock}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </SlideUpTransition>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No products found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SlideUpTransition show={true}>
            <GlassCard className="w-full max-w-md">
              <div className="p-4 border-b">
                <h2 className="font-medium">Add New Product</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Product Name</label>
                  <Input 
                    name="name" 
                    value={newProduct.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter product name" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Price</label>
                    <Input 
                      name="price" 
                      value={newProduct.price} 
                      onChange={handleInputChange} 
                      placeholder="Enter price" 
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Stock</label>
                    <Input 
                      name="stock" 
                      value={newProduct.stock} 
                      onChange={handleInputChange} 
                      placeholder="Enter stock" 
                      type="number"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Input 
                    name="category" 
                    value={newProduct.category} 
                    onChange={handleInputChange} 
                    placeholder="Enter category" 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Barcode</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="barcode"
                      value={newProduct.barcode}
                      onChange={handleInputChange}
                      placeholder="Enter barcode number"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct}>
                    Add Product
                  </Button>
                </div>
              </div>
            </GlassCard>
          </SlideUpTransition>
        </div>
      )}
    </div>
  );
};

export default Products;
