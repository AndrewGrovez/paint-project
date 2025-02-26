'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell, PaintBucket, TrendingDown } from 'lucide-react'
import Image from 'next/image'

type Product = {
  id: string
  title: string
  currentPrice: number
  previousPrice: number
  brand: string
  savings: string
  imageUrl: string
}

const exampleProducts: Product[] = [
  {
    id: "example1",
    title: "Dulux Trade Diamond Matt",
    currentPrice: 45.99,
    previousPrice: 52.99,
    brand: "Dulux",
    savings: "13%",
    imageUrl: "/images/Dulux Trade Diamond Matt.jpg"
  },
  {
    id: "example2",
    title: "Crown Clean Extreme Matt",
    currentPrice: 39.99,
    previousPrice: 44.99,
    brand: "Crown",
    savings: "11%",
    imageUrl: "/images/Crown Clean Extreme Matt.jpg"
  },
  {
    id: "example3",
    title: "Johnstone\'s Trade Vinyl Matt",
    currentPrice: 35.99,
    previousPrice: 42.99,
    brand: "Johnstone\'s",
    savings: "16%",
    imageUrl: "/images/Johnstones Trade Vinyl Matt.jpg"
  }
];

export default function Home() {
  const [products] = useState<Product[]>(exampleProducts)

  return (
    <div className="min-h-screen bg-[url('/images/canvas-texture.jpg')] bg-cover bg-fixed text-gray-900 overflow-x-hidden">
      {/* Hero Section (from First "FUCKING AWESOME" Design) */}
      <div className="relative pt-16 pb-32 overflow-hidden bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_transparent_70%)] opacity-20 animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('/images/paint-splash.png')] bg-no-repeat bg-center opacity-10 animate-fade-in"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Logo with Animation */}
            <div className="flex justify-center mb-10 transform hover:scale-110 transition-transform duration-500">
              <Image
                src="/images/Paint Price Tracker Logo.png"
                alt="Paint Price Tracker Logo"
                width={250}
                height={125}
                priority
                className="drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]"
              />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 animate-fade-in-down">
              Never Miss a Paint Deal
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-gray-300 animate-fade-in-up delay-200">
              Track prices on top paint brands. Get notified when prices drop. Save money on your next painting project.
            </p>
            {/* Login Link */}
            <div className="mt-6 text-gray-400 animate-fade-in-up delay-300">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
            {/* CTA Button */}
            <div className="mt-10 max-w-md mx-auto animate-fade-in-up delay-400">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-full text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
              >
                Get Started
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section (Painting Theme) */}
      <div className="py-16 bg-gradient-to-b from-gray-100 to-white relative">
        <div className="absolute inset-0 bg-[url('/images/paint-drip.png')] bg-no-repeat bg-top opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: PaintBucket, title: "Top Paint Brands", desc: "Track prices from Dulux, Crown, Johnstone's and more." },
              { icon: Bell, title: "Price Drop Alerts", desc: "Get notified instantly when prices drop on your tracked items." },
              { icon: TrendingDown, title: "Price History", desc: "See price trends and find the best time to buy." },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border-t-4 border-blue-400 hover:bg-white hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <feature.icon className="h-10 w-10 text-blue-500" />
                <h3 className="mt-4 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Example Savings Section (Painting Theme) */}
      <div className="py-16 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-gray-900 text-center">
            Example Savings
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 text-center">
            See how much you could save by tracking paint prices
          </p>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-md border-b-4 border-teal-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all duration-300 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="p-6">
                  <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden mb-6 relative group">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={240}
                      height={240}
                      quality={85}
                      className="object-contain transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-[url('/images/paint-splat.png')] bg-no-repeat bg-center opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{product.title}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-2xl font-extrabold text-green-600">
                      £{product.currentPrice.toFixed(2)}
                    </span>
                    <span className="text-sm line-through text-gray-500">
                      £{product.previousPrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Save {product.savings}
                    </span>
                  </div>
                  <div className="mt-6">
                    <Link
                      href="/signup"
                      className="group w-full inline-flex justify-center items-center px-4 py-2 text-sm font-bold rounded-full text-white bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-blue-500/40"
                    >
                      Track Similar Products <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section (Painting Theme) */}
      <div className="bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/paint-brushstroke.png')] bg-no-repeat bg-bottom opacity-20"></div>
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Start saving on paint today
          </h2>
          <p className="mt-6 text-xl text-white drop-shadow">
            Join thousands of DIY enthusiasts and professional decorators who save money with Paint Price Tracker.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-blue-600 bg-white hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  )
}