
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
  Save,
  FileDown,
  Calendar,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui-custom/GlassCard";
import { formatCurrency } from "@/api/api";
import { SlideUpTransition } from "@/hooks/useTransition";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { ProductsAPI } from "@/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/ui-custom/DateRangePicker";
import { addDays, format, isWithinInterval, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductFilters from "@/components/products/ProductFilters";
import ExportProductsModal from "@/components/products/ExportProductsModal";
import { EditProductModal } from "@/components/products/EditProductModal";

const Products = () => {
  const [search, setSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | null>(null);
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: ""
  });

  const queryClient = useQueryClient();

  // Fetch products from API
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: ProductsAPI.getAll
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: ProductsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produk ditambahkan",
        description: "Produk berhasil ditambahkan",
      });
      setShowAddProduct(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan produk",
        description: error.message || "Terjadi kesalahan saat menambahkan produk",
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data) => ProductsAPI.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produk diperbarui",
        description: "Produk berhasil diperbarui",
      });
      setShowEditProduct(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui produk",
        description: error.message || "Terjadi kesalahan saat memperbarui produk",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: ProductsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produk dihapus",
        description: "Produk berhasil dihapus",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus produk",
        description: error.message || "Terjadi kesalahan saat menghapus produk",
        variant: "destructive",
      });
    }
  });

  // Listen for search events from the header
  useEffect(() => {
    const handleGlobalSearch = (event: CustomEvent) => {
      setSearch(event.detail);
    };

    window.addEventListener('app-search', handleGlobalSearch as EventListener);
    
    return () => {
      window.removeEventListener('app-search', handleGlobalSearch as EventListener);
    };
  }, []);

  // Update filtered products when products or search or filters change
  useEffect(() => {
    if (products) {
      let filtered = [...products];

      // Apply search filter
      if (search !== "") {
        const searchTerm = search.toLowerCase();
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
      }

      // Apply category filter
      if (categoryFilter) {
        filtered = filtered.filter(product => product.category === categoryFilter);
      }

      // Apply stock filter
      if (stockFilter === "low") {
        filtered = filtered.filter(product => product.stock > 0 && product.stock < 10);
      } else if (stockFilter === "out") {
        filtered = filtered.filter(product => product.stock === 0);
      }

      // Apply date range filter if available
      if (dateRange.from && dateRange.to) {
        filtered = filtered.filter(product => {
          // Assuming product has a createdAt field
          if (product.createdAt) {
            const productDate = parseISO(product.createdAt);
            return isWithinInterval(productDate, { 
              start: dateRange.from, 
              end: dateRange.to 
            });
          }
          return true; // Include products without dates
        });
      }

      // Apply sorting
      if (sortField && sortOrder) {
        filtered.sort((a, b) => {
          if (sortField === "name") {
            return sortOrder === "asc" 
              ? a.name.localeCompare(b.name) 
              : b.name.localeCompare(a.name);
          } else if (sortField === "price") {
            return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
          } else {
            return sortOrder === "asc" ? a.stock - b.stock : b.stock - a.stock;
          }
        });
      }

      setFilteredProducts(filtered);
    }
  }, [products, search, sortField, sortOrder, categoryFilter, stockFilter, dateRange]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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
  };

  const handleAddProduct = () => {
    // Validate form
    if (!newProduct.name || !newProduct.price || !newProduct.stock || !newProduct.category) {
      toast({
        title: "Data tidak lengkap",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }
    
    // Create product object
    const productToCreate = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      category: newProduct.category,
    };
    
    // Call API using mutation
    createProductMutation.mutate(productToCreate);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = (updatedProduct) => {
    updateProductMutation.mutate(updatedProduct);
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      price: "",
      stock: "",
      category: ""
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };

  const handleDeleteProduct = (productId) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map(product => product.category))).filter(Boolean);
  }, [products]);

  if (isError) {
    return (
      <div className="container px-4 mx-auto max-w-7xl py-12 text-center">
        <h2 className="text-xl font-semibold mb-4">Error loading products</h2>
        <p className="text-muted-foreground mb-6">
          There was an error connecting to the database. Please check your connection and try again.
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto max-w-7xl pb-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-center mb-6 mt-6">
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={handleSearch}
            className="pl-9 w-full bg-background/50 backdrop-blur-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <DateRangePicker 
            date={dateRange} 
            onDateChange={setDateRange} 
          />
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowExport(true)}
          >
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
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
                      Produk
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "name" ? "text-primary" : ""}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-sm">Kategori</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-sm">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSort("price")}>
                      Harga
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "price" ? "text-primary" : ""}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-sm">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSort("stock")}>
                      Stok
                      <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "stock" ? "text-primary" : ""}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center font-medium text-muted-foreground text-sm">Aksi</th>
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
                        <td className="py-3 px-4 text-right text-sm">{formatCurrency(product.price)}</td>
                        <td className="py-3 px-4 text-right text-sm">
                          <span className={`${product.stock <= 5 ? 'text-destructive' : product.stock <= 10 ? 'text-yellow-500' : ''}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deleteProductMutation.isPending}
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
                    <td colSpan={5} className="py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
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
                <h2 className="font-medium">Tambah Produk Baru</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nama Produk</label>
                  <Input 
                    name="name" 
                    value={newProduct.name} 
                    onChange={handleInputChange} 
                    placeholder="Masukkan nama produk" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Harga</label>
                    <Input 
                      name="price" 
                      value={newProduct.price} 
                      onChange={handleInputChange} 
                      placeholder="Masukkan harga" 
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Stok</label>
                    <Input 
                      name="stock" 
                      value={newProduct.stock} 
                      onChange={handleInputChange} 
                      placeholder="Masukkan stok" 
                      type="number"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Kategori</label>
                  <Input 
                    name="category" 
                    value={newProduct.category} 
                    onChange={handleInputChange} 
                    placeholder="Masukkan kategori" 
                  />
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                    Batal
                  </Button>
                  <Button 
                    onClick={handleAddProduct}
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Menambahkan...
                      </>
                    ) : (
                      "Tambah Produk"
                    )}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </SlideUpTransition>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setShowEditProduct(false)}
          onSave={handleUpdateProduct}
          isLoading={updateProductMutation.isPending}
        />
      )}

      {/* Filter Modal */}
      {showFilters && (
        <ProductFilters
          categories={categories}
          selectedCategory={categoryFilter}
          onCategoryChange={setCategoryFilter}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportProductsModal
          products={filteredProducts}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default Products;
