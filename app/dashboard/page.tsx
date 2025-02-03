'use client'

import PriceAlerts from '@/components/PriceAlerts'
import DashboardHeader from '@/components/DashboardHeader'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useProductTracking } from '@/hooks/useProductTracking'
import { createClient } from '@supabase/supabase-js'
import { toast, Toaster } from 'sonner'

type Product = {
  id: string;
  title: string;
  subtitle: string;
  brand: string;
  category: string;
  amazonUrl: string;
  features: string[];
  currentPrice?: number;
  previousPrice?: number;
  lastUpdated?: string;
  imageUrl?: string;
  apiTitle?: string;
}

// Initial product data
const PAINT_PRODUCTS: Product[] = [
    {
        id: "B08BK4VLC7",
        title: "Crown Clean Extreme Scrubbable Matt",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40FCMn8",
        features: [
            "Scrubbable and washable",
            "Extreme durability",
            "5 litre capacity",
            "Matt finish"
        ]
    },
    {
        id: "B005QWB23Q",
        title: "Johnstone's Trade Covaplus Emulsion",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3PXX8TC",
        features: [
            "5 litre capacity",
            "Emulsion finish",
            "Brilliant White",
            "Trade quality"
        ]
    },
    {
        id: "B005Q7BC90",
        title: "Johnstone's Trade Vinyl Matt",
        subtitle: "Brilliant White (2.5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3Cx2L8n",
        features: [
            "2.5 litre capacity",
            "Vinyl matt finish",
            "Brilliant White",
            "High durability"
        ]
    },
    {
        id: "B005QWAI68",
        title: "Johnstone's Trade Undercoat",
        subtitle: "Brilliant White (2.5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3CvySVQ",
        features: [
            "2.5 litre capacity",
            "Professional undercoat",
            "Smooth base finish",
            "Trade grade"
        ]
    },
    {
        id: "B0CP69VSW7",
        title: "Johnstone's Trade Guard Durable Matt",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3CCybdm",
        features: [
            "Mould-resistant",
            "Durable finish",
            "Matt texture",
            "5 litre capacity"
        ]
    },
    {
        id: "B00OKCWT30",
        title: "Johnstone's Trade Water-Based Satin",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3CvEfVe",
        features: [
            "Water-based formula",
            "Satin finish",
            "Low odour",
            "Easy application"
        ]
    },
    {
        id: "B0CP6BZQ22",
        title: "Johnstone's Trade Jonmat Premium Contract Matt",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40DvVdP",
        features: [
            "Premium contract matt",
            "High coverage",
            "Scrubbable finish",
            "5 litre capacity"
        ]
    },
    {
        id: "B005QWB7XQ",
        title: "Johnstone's Trade Acrylic Eggshell",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40B1ViT",
        features: [
            "Acrylic eggshell finish",
            "Washable",
            "5 litre capacity",
            "Mid-sheen"
        ]
    },
    {
        id: "B08PMCPR4B",
        title: "Johnstone's Trade Guard Brilliant",
        subtitle: "White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3PWtqhP",
        features: [
            "Anti-mould protection",
            "Matt finish",
            "5 litre capacity",
            "Damp-resistant"
        ]
    },
    {
        id: "B0CPJD1WCF",
        title: "Johnstone's Trade Water-Based Gloss",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3PZ31A9",
        features: [
            "Water-based gloss",
            "Quick-drying",
            "High shine finish",
            "5 litre capacity"
        ]
    },
    {
        id: "B08LTW293L",
        title: "Crown Trade Extreme Inhibiting Matt",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3Cx2Ngv",
        features: [
            "Rust-inhibiting formula",
            "Matt finish",
            "5 litre capacity",
            "Metal surface protection"
        ]
    },
    {
        id: "B08LTRLF6F",
        title: "Crown Trade Covermatt Obliterating Emulsion",
        subtitle: "White (10 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3Cvz3R0",
        features: [
            "High opacity coverage",
            "Matt emulsion",
            "Stain-blocking",
            "10 litre capacity"
        ]
    },
    {
        id: "B08KWBQY9R",
        title: "Crown Vinyl Matt",
        subtitle: "White (7.5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4hx7LbV",
        features: [
            "Vinyl matt finish",
            "7.5 litre capacity",
            "Washable surface",
            "Interior use"
        ]
    },
    {
        id: "B08KW8KN3L",
        title: "Crown Trade Gloss",
        subtitle: "Brilliant White (5 litre)",
        brand: "Crown",
        category: "Interior & Exterior Paint",
        amazonUrl: "https://amzn.to/3PTojz9",
        features: [
            "High gloss finish",
            "5 litre capacity",
            "Wood & metal surfaces",
            "Durable coating"
        ]
    },
    {
        id: "B07J66BVWF",
        title: "Crown Trade Fastflow Satin",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4giFWmH",
        features: [
            "Fast-drying formula",
            "Satin finish",
            "5 litre capacity",
            "Smooth application"
        ]
    },
    {
        id: "B08DRDMTZ9",
        title: "Crown Trade Fastflow Interior/Exterior",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3Cv8208",
        features: [
            "Dual-purpose paint",
            "Quick-drying",
            "5 litre capacity",
            "All-surface use"
        ]
    },
    {
        id: "B0D2Y2PBJ4",
        title: "Crown Trade Fastflow Primer Undercoat",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Primer Paint",
        amazonUrl: "https://amzn.to/3WDccd8",
        features: [
            "Primer-undercoat combo",
            "Fast-drying",
            "5 litre capacity",
            "Smooth base layer"
        ]
    },
    {
        id: "B00CITDGOI",
        title: "Crown Trade Acrylic Quick-Drying Eggshell",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3WB1C6s",
        features: [
            "Acrylic eggshell",
            "Quick-drying",
            "5 litre capacity",
            "Mid-sheen finish"
        ]
    },
    {
        id: "B08LTQCVL1",
        title: "Crown Trade All-Purpose Primer",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4hv6GC1",
        features: [
            "Multi-surface primer",
            "5 litre capacity",
            "Stain-blocking",
            "Adhesion promoter"
        ]
    },
    {
        id: "B08KW9JWLX",
        title: "Crown Trade Eggshell",
        subtitle: "White (5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3WCQKVL",
        features: [
            "Eggshell finish",
            "5 litre capacity",
            "Wipeable surface",
            "Durable coating"
        ]
    },
    {
        id: "B08LTVDK6N",
        title: "Crown Steracryl Inhibiting Acrylic Eggshell",
        subtitle: "White (2.5 litre)",
        brand: "Crown",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4aBILxM",
        features: [
            "Rust-inhibiting",
            "Acrylic eggshell",
            "2.5 litre capacity",
            "Metal protection"
        ]
    },
    {
        id: "B098JTHMYY",
        title: "Johnstone's Perfect Matt",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4hvPoE4",
        features: [
            "Ultra-matt finish",
            "Stain-resistant",
            "5 litre capacity",
            "One-coat coverage"
        ]
    },
    {
        id: "B07L8LX6FL",
        title: "Johnstone's Stain Away Matt",
        subtitle: "Brilliant White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4hCBS1w",
        features: [
            "Stain-repellent technology",
            "Matt finish",
            "5 litre capacity",
            "Wipeable surface"
        ]
    },
    {
        id: "B007ZU78JO",
        title: "Dulux Diamond Matt",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4aUQszD",
        features: [
            "Diamond quality",
            "Matt finish",
            "5 litre capacity",
            "Trade quality"
        ]
    },
    {
        id: "B005QWBAQ0",
        title: "Johnstone's Trade Acrylic Matt",
        subtitle: "White (5 litre)",
        brand: "Johnstone's",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3EqyqJ0",
        features: [
            "Trade quality",
            "Acrylic matt finish",
            "5 litre capacity",
            "Professional grade"
        ]
    },
    {
        id: "B08FDN5WD5",
        title: "Dulux Trade Vinyl Matt",
        subtitle: "Special Value White (10 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40wayey",
        features: [
            "Professional trade paint",
            "Matt finish",
            "10 litre capacity",
            "Value size"
        ]
    },
    {
        id: "B07N2T83TQ",
        title: "Dulux Trade Diamond Satinwood",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4geyyJ7",
        features: [
            "Diamond quality",
            "Satinwood finish",
            "5 litre capacity",
            "Durable finish"
        ]
    },
    {
        id: "B08FDP4GHW",
        title: "Dulux Super Matt",
        subtitle: "Interior Paint (10 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3WHsQsi",
        features: [
            "Super matt finish",
            "Interior use",
            "10 litre capacity",
            "Professional quality"
        ]
    },
    {
        id: "B07K6S3QKR",
        title: "Dulux Trade Quick Dry Satinwood",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40AZZHc",
        features: [
            "Quick drying formula",
            "Satinwood finish",
            "5 litre capacity",
            "Trade quality"
        ]
    },
    {
        id: "B007ZU77VS",
        title: "Dulux Trade Gloss",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4aF8SnR",
        features: [
            "High gloss finish",
            "Trade quality",
            "5 litre capacity",
            "Professional grade"
        ]
    },
    {
        id: "B007ZU77EA",
        title: "Dulux Trade Diamond Eggshell",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4hEaUH7",
        features: [
            "Diamond quality",
            "Eggshell finish",
            "5 litre capacity",
            "Durable finish"
        ]
    },
    {
        id: "B00EJFDXUQ",
        title: "Dulux Trade Mouldshield Fungicidal Matt",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4aEL5nV",
        features: [
            "Fungicidal protection",
            "Matt finish",
            "5 litre capacity",
            "Anti-mould properties"
        ]
    },
    {
        id: "B00EJDZYYQ",
        title: "Dulux Trade Undercoat",
        subtitle: "White (2.5 litre)",
        brand: "Dulux",
        category: "Undercoat Paint",
        amazonUrl: "https://amzn.to/3WDFIj0",
        features: [
            "Professional undercoat",
            "2.5 litre capacity",
            "Trade quality",
            "Ideal base coat"
        ]
    },
    {
        id: "B07K496P7Z",
        title: "Dulux Trade Quick Dry Gloss",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4aCmsIq",
        features: [
            "Quick drying formula",
            "Gloss finish",
            "5 litre capacity",
            "Trade quality"
        ]
    },
    {
        id: "B00EJF8GEO",
        title: "Dulux Trade Durable Flat Matt",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/4aAwuKd",
        features: [
            "Durable formula",
            "Flat matt finish",
            "5 litre capacity",
            "Trade quality"
        ]
    },
    {
        id: "B08W2FN211",
        title: "WRX Trade Satinwood Paint",
        subtitle: "Brilliant White (5 litre)",
        brand: "WRX Trade",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/3PWMMna",
        features: [
            "Satinwood finish",
            "High gloss durability",
            "5 litre capacity",
            "Wood & metal surfaces"
        ]
    },
    {
        id: "B08W264522",
        title: "WRX Trade Satinwood Paint",
        subtitle: "Brilliant White (2.5 litre)",
        brand: "WRX Trade",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40WOTxK",
        features: [
            "Satinwood finish",
            "2.5 litre capacity",
            "Quick-drying",
            "Interior use"
        ]
    },
    {
        id: "B0CK7BQQJB",
        title: "WRX Trade Gloss Paint",
        subtitle: "Brilliant White (5 litre)",
        brand: "WRX Trade",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40QHShQ",
        features: [
            "Gloss finish",
            "High shine",
            "5 litre capacity",
            "Durable coating"
        ]
    },
    {
        id: "B091273N26",
        title: "Eggshell Interior Paint",
        subtitle: "Bathrooms & Kitchens (High Traffic)",
        brand: "Generic",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/42ADwMR",
        features: [
            "Eggshell finish",
            "High-traffic resistance",
            "Moisture-resistant",
            "Washable"
        ]
    },
    {
        id: "B077B38Q86",
        title: "TIKKURILA Sauna Wax SUPI",
        subtitle: "Transparent (1 litre)",
        brand: "TIKKURILA",
        category: "Specialty Paint",
        amazonUrl: "https://amzn.to/42D7PTd",
        features: [
            "Sauna protection",
            "Transparent finish",
            "Heat-resistant",
            "1 litre capacity"
        ]
    },
    {
        id: "B08W1PFSS2",
        title: "Trade Ceiling Paint",
        subtitle: "Brilliant White (5 litre)",
        brand: "Generic",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/42vBGgt",
        features: [
            "Ceiling-specific formula",
            "Matt finish",
            "5 litre capacity",
            "Stain-blocking"
        ]
    },
    {
        id: "B0B152GYKK",
        title: "TIKKURILA Helmi Performance Furniture Paint",
        subtitle: "Water-Based (1 litre)",
        brand: "TIKKURILA",
        category: "Furniture Paint",
        amazonUrl: "https://amzn.to/3CiVU2n",
        features: [
            "Water-based formula",
            "Furniture & cabinetry",
            "1 litre capacity",
            "Scrubbable finish"
        ]
    },
    {
        id: "B06XPMGS51",
        title: "Farrow & Ball Estate Emulsion",
        subtitle: "5 Litre",
        brand: "Farrow & Ball",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/42yJPRi",
        features: [
            "Estate emulsion finish",
            "5 litre capacity",
            "Heritage colours",
            "Washable"
        ]
    },
    {
        id: "B0B5GWV758",
        title: "TIKKURILA Super White",
        subtitle: "Water-Based (10 litre)",
        brand: "TIKKURILA",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/42Sx8kz",
        features: [
            "Ultra-white finish",
            "10 litre capacity",
            "Water-based",
            "High coverage"
        ]
    },
    {
        id: "B00CTMRUOQ",
        title: "Farrow & Ball Modern Emulsion",
        subtitle: "2.5 Litre",
        brand: "Farrow & Ball",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/42zrnb3",
        features: [
            "Modern emulsion",
            "2.5 litre capacity",
            "Contemporary colours",
            "Low sheen"
        ]
    },
    {
        id: "B08MTNYGQX",
        title: "TIKKURILA Presto Renovation Filler",
        subtitle: "1 Litre",
        brand: "TIKKURILA",
        category: "Paint Supplies",
        amazonUrl: "https://amzn.to/4gmBtPZ",
        features: [
            "Multi-surface filler",
            "1 litre capacity",
            "Quick-drying",
            "Sanding-friendly"
        ]
    },
    {
        id: "B0B29HS16Q",
        title: "TIKKURILA Miranol Ultra",
        subtitle: "Windows & Furniture Paint (1 litre)",
        brand: "TIKKURILA",
        category: "Furniture Paint",
        amazonUrl: "https://amzn.to/4giqqXY",
        features: [
            "High-gloss finish",
            "UV-resistant",
            "1 litre capacity",
            "Water-based"
        ]
    },
    {
        id: "B09P7XMKW6",
        title: "TIKKURILA Supi Floor Oil",
        subtitle: "Derivatives (1 litre)",
        brand: "TIKKURILA",
        category: "Floor Paint",
        amazonUrl: "https://amzn.to/40RnX2g",
        features: [
            "Floor protection oil",
            "1 litre capacity",
            "Wood & concrete",
            "Durable finish"
        ]
    },
    {
        id: "B0B29MY4CY",
        title: "TIKKURILA Vinyl Matt Performance Emulsion",
        subtitle: "5 Litre",
        brand: "TIKKURILA",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40PY0A6",
        features: [
            "Vinyl matt emulsion",
            "5 litre capacity",
            "Washable",
            "High opacity"
        ]
    },
    {
        id: "B0B1F2VWX6",
        title: "TIKKURILA Kiva 10 Lacquer",
        subtitle: "Furniture Paint (1 litre)",
        brand: "TIKKURILA",
        category: "Furniture Paint",
        amazonUrl: "https://amzn.to/4jNiD7A",
        features: [
            "Lacquer finish",
            "1 litre capacity",
            "High durability",
            "Wood & metal"
        ]
    },
    {
        id: "B0B52D632R",
        title: "TIKKURILA Optiva Primer",
        subtitle: "Absorbent Ceilings (5 litre)",
        brand: "TIKKURILA",
        category: "Primer",
        amazonUrl: "https://amzn.to/3EqyJ6C",
        features: [
            "Primer for ceilings",
            "5 litre capacity",
            "Stain-blocking",
            "Low odour"
        ]
    },
    {
        id: "B0B15KFLJW",
        title: "TIKKURILA Helmi Performance Furniture Paint",
        subtitle: "Water-Based (750 ml)",
        brand: "TIKKURILA",
        category: "Furniture Paint",
        amazonUrl: "https://amzn.to/413RR3z",
        features: [
            "Water based formula",
            "750 ml capacity",
            "Quick-drying",
            "Scrubbable"
        ]
    },
    {
        id: "B007ZU77PE",
        title: "Dulux Trade Vinyl Matt",
        subtitle: "Pure Brilliant White (5 litre)",
        brand: "Dulux",
        category: "Interior Paint",
        amazonUrl: "https://amzn.to/40WOVpm",
        features: [
            "Vinyl matt finish",
            "Trade quality",
            "5 litre capacity",
            "Professional grade"
        ]
    }
];

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  export default function Dashboard() {
    const [products, setProducts] = useState<Product[]>(PAINT_PRODUCTS)
    const [isLoadingPrices, setIsLoadingPrices] = useState(true)
    const [selectedBrand, setSelectedBrand] = useState<string>('')
    const [selectedSize, setSelectedSize] = useState<string>('')
    const { trackedProducts, isLoading: isLoadingTracking, trackProduct } = useProductTracking()
    const router = useRouter()
  
    // Filter logic for brand and size
    const filteredProducts = products.filter(product => {
      const brandMatch = selectedBrand ? product.brand === selectedBrand : true
      const sizeMatch = selectedSize ? product.subtitle.includes(`(${selectedSize} litre`) : true
      return brandMatch && sizeMatch
    })
  
    // Build unique lists for filter dropdowns
    const brands = Array.from(new Set(products.map(p => p.brand)))
    const sizes = Array.from(new Set(products.map(p => {
      const match = p.subtitle.match(/\((\d+\.?\d*)\s*litre\)/i)
      return match ? match[1] : null
    }))).filter((size): size is string => size !== null)
  
    useEffect(() => {
      fetchPrices()
    }, [])
  
    /**
     * Fetch pricing info from Supabase and image/title info from the Amazon API,
     * then merge both sets of data using a functional state update.
     */
    const fetchPrices = async () => {
      try {
        setIsLoadingPrices(true)
        // 1. Fetch pricing info from Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('products')
          .select('id, current_price, last_price, last_updated')
        if (supabaseError) {
          throw supabaseError
        }
        
        // 2. Fetch image and title info from Amazon API
        const response = await fetch('/api/prices')
        if (!response.ok) {
          throw new Error('Failed to fetch from /api/prices')
        }
        const amazonData = await response.json()
        
        // 3. Merge both sets of data
        setProducts(prevProducts =>
          prevProducts.map(product => {
            const sbItem = supabaseData?.find((item: any) => item.id === product.id)
            const apiItem = amazonData.prices?.[product.id]
            return {
              ...product,
              currentPrice: sbItem?.current_price ?? product.currentPrice,
              previousPrice: sbItem?.last_price ?? product.previousPrice,
              lastUpdated: sbItem?.last_updated ?? product.lastUpdated,
              imageUrl: apiItem?.imageUrl || product.imageUrl,
              apiTitle: apiItem?.title || product.title,
            }
          })
        )
      } catch (error) {
        console.error('Failed to fetch prices:', error)
      } finally {
        setIsLoadingPrices(false)
      }
    }
  
    const handleTrackProduct = async (productId: string) => {
      try {
        await trackProduct(productId)
        toast.success(
          trackedProducts.has(productId)
            ? 'Product removed from tracking'
            : 'Product is now being tracked'
        )
      } catch (err) {
        toast.error('Failed to update tracking')
      }
    }
  
    const formatPrice = (price?: number) => {
      return price ? `£${price.toFixed(2)}` : 'Price unavailable'
    }
  
    const getPriceChange = (current?: number, previous?: number) => {
      if (!current || !previous) return null
      return ((current - previous) / previous * 100).toFixed(1)
    }
  
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster />
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Decorating Deals</h1>
            {/* Replace the old sign-out button with DashboardHeader */}
            <DashboardHeader />
          </div>
        </header>
  
        <main className="max-w-7xl mx-auto px-4 py-6">
          <PriceAlerts />
          
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sizes</option>
                {sizes.map(size => (
                  <option key={size} value={size}>{size} Litre</option>
                ))}
              </select>
            </div>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {product.brand}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="aspect-w-1 aspect-h-1 overflow-hidden rounded-lg bg-white mb-4">
                    <img
                      src={product.imageUrl || '/placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-48 object-contain"
                    />
                  </div>
  
                  <h3 className="text-xl font-semibold mb-1">
                    {product.apiTitle || product.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{product.subtitle}</p>
  
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    {isLoadingPrices ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(product.currentPrice)}
                        </div>
                        {product.previousPrice && (
                          <div className="text-sm mt-1">
                            {getPriceChange(product.currentPrice, product.previousPrice) && (
                              <span className={`font-medium ${
                                Number(getPriceChange(product.currentPrice, product.previousPrice)) < 0 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {Number(getPriceChange(product.currentPrice, product.previousPrice)) < 0 ? '↓' : '↑'}
                                {Math.abs(Number(getPriceChange(product.currentPrice, product.previousPrice)))}%
                              </span>
                            )}
                            <span className="text-gray-500 ml-2">
                              Previous: {formatPrice(product.previousPrice)}
                            </span>
                          </div>
                        )}
                        {product.lastUpdated && (
                          <div className="text-xs text-gray-500 mt-1">
                            Updated: {new Date(product.lastUpdated).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Features:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {product.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
  
                    <div className="py-4 border-t border-gray-100">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleTrackProduct(product.id)}
                          disabled={isLoadingTracking}
                          className={`w-full px-4 py-2 rounded-md transition-colors duration-200 ${
                            trackedProducts.has(product.id)
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          } ${isLoadingTracking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isLoadingTracking ? 'Loading...' : 
                            trackedProducts.has(product.id) ? 'Stop Tracking' : 'Track Price'
                          }
                        </button>
                        <a
                          href={product.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors duration-200"
                        >
                          View on Amazon
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }