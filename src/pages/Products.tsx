import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  FileDown,
  Trash2,
  ArrowUpDown,
  Edit,
  Package,
  MoreVertical,
  Save,
  X,
  Camera,
  Upload,
  ImageIcon
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
import { DateRange } from "react-day-picker";
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
import { takePhoto, pickPhoto, convertPhotoToBase64 } from "@/utils/imageUtils";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  createdAt?: string;
  imageUrl?: string;
}

const Products = () => {
  const [search, setSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [sortField, setSortField] = useState<"name" | "price" | "stock" | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  
  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    imageBase64: null as string | null
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch products from API
  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
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
    onError: (error: any) => {
      toast({
        title: "Gagal menambahkan produk",
        description: error.message || "Terjadi kesalahan saat menambahkan produk",
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (data: Product) => ProductsAPI.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produk diperbarui",
        description: "Produk berhasil diperbarui",
      });
      setShowEditProduct(false);
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
      if (dateRange?.from && dateRange?.to) {
        filtered = filtered.filter(product => {
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
      imageBase64: newProduct.imageBase64
    };
    
    // Call API using mutation
    createProductMutation.mutate(productToCreate);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    updateProductMutation.mutate(updatedProduct);
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      price: "",
      stock: "",
      category: "",
      imageBase64: null
    });
    setPhotoPreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      deleteProductMutation.mutate(productId);
    }
  };
  
  const handleTakePhoto = async () => {
    try {
      const photoUri = await takePhoto();
      if (photoUri) {
        setPhotoPreview(photoUri);
        
        // Convert to base64 for API upload
        const base64Data = await convertPhotoToBase64(photoUri);
        setNewProduct({
          ...newProduct,
          imageBase64: base64Data
        });
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast({
        title: "Gagal mengambil foto",
        description: "Terjadi kesalahan saat mengambil foto",
        variant: "destructive"
      });
    }
  };
  
  const handlePickPhoto = async () => {
    try {
      const photoUri = await pickPhoto();
      if (photoUri) {
        setPhotoPreview(photoUri);
        
        // Convert to base64 for API upload
        const base64Data = await convertPhotoToBase64(photoUri);
        setNewProduct({
          ...newProduct,
          imageBase64: base64Data
        });
      }
    } catch (error) {
      console.error("Error picking photo:", error);
      toast({
        title: "Gagal memilih foto",
        description: "Terjadi kesalahan saat memilih foto",
        variant: "destructive"
      });
    }
  };
  
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setNewProduct({
      ...newProduct,
      imageBase64: null
    });
  };

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map(product => product.category))).filter(Boolean) as string[];
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
      {/* Search bar */}
      <div className="mt-4 mb-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={handleSearch}
            className="pl-10 w-full bg-gray-100/80 border-gray-200 rounded-xl h-12 text-base"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant="outline" 
          className="gap-2 bg-white rounded-xl h-12 flex-1 border border-gray-200 shadow-sm"
          onClick={() => setShowFilters(true)}
        >
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-gray-600">Filter</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="gap-2 bg-white rounded-xl h-12 flex-1 border border-gray-200 shadow-sm"
          onClick={() => setDateRange({ 
            from: new Date(), 
            to: addDays(new Date(), 7) 
          })}
        >
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-gray-600">Tanggal</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="gap-2 bg-white rounded-xl h-12 flex-1 border border-gray-200 shadow-sm"
          onClick={() => setShowExport(true)}
        >
          <FileDown className="h-5 w-5 text-gray-500" />
          <span className="text-gray-600">Export</span>
        </Button>
      </div>

      {/* Add Product Button */}
      <Button 
        className="w-full mb-6 bg-blue-500 hover:bg-blue-600 h-12 rounded-xl flex gap-2 items-center justify-center"
        onClick={() => setShowAddProduct(true)}
      >
        <Plus className="h-5 w-5" />
        <span className="text-base">Tambah Produk</span>
      </Button>

      {/* Products Table */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
            <span className="ml-3">Loading products...</span>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-12 py-4 px-4 border-b text-gray-500 font-medium text-sm">
              <div className="col-span-6">Kategori</div>
              <div className="col-span-3 flex items-center justify-end cursor-pointer" onClick={() => handleSort("price")}>
                Harga
                <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "price" ? "text-blue-500" : ""}`} />
              </div>
              <div className="col-span-2 flex items-center justify-end cursor-pointer" onClick={() => handleSort("stock")}>
                Stok
                <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortField === "stock" ? "text-blue-500" : ""}`} />
              </div>
              <div className="col-span-1 text-center">Aksi</div>
            </div>
            
            {/* Table Body */}
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <SlideUpTransition key={product.id} show={true} duration={300 + index * 30}>
                  <div className="grid grid-cols-12 py-4 px-4 border-b hover:bg-gray-50 transition-colors items-center">
                    <div className="col-span-6 flex items-center gap-3">
                      {product.imageUrl ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right">{formatCurrency(product.price)}</div>
                    <div className="col-span-2 text-right">
                      <span className={`${product.stock <= 5 ? 'text-red-500' : product.stock <= 10 ? 'text-yellow-500' : ''}`}>
                        {product.stock}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deleteProductMutation.isPending}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </SlideUpTransition>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Gambar Produk</label>
                  
                  {photoPreview ? (
                    <div className="relative w-full h-40 mb-2">
                      <img 
                        src={photoPreview} 
                        alt="Product preview" 
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={handleRemovePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md py-8 flex flex-col items-center justify-center text-gray-500">
                      <ImageIcon className="h-12 w-12 mb-2" />
                      <p className="text-sm">Belum ada gambar</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={handleTakePhoto}
                    >
                      <Camera className="h-4 w-4" />
                      Ambil Foto
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={handlePickPhoto}
                    >
                      <Upload className="h-4 w-4" />
                      Pilih Foto
                    </Button>
                  </div>
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
