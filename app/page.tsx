'use client'

import { useState, useEffect } from 'react'
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

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

    const exampleProducts = [
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
            title: "Johnstone's Trade Vinyl Matt",
            currentPrice: 35.99,
            previousPrice: 42.99,
            brand: "Johnstone's",
            savings: "16%",
            imageUrl: "/images/Johnstones Trade Vinyl Matt.jpg"
        }
    ];

    useEffect(() => {
        setFeaturedProducts(exampleProducts);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white">
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
                <Image
                    src="/images/Paint Price Tracker Logo.png"  // Update this path to match your logo's filename
                    alt="Paint Price Tracker Logo"
                    width={200}  // Adjust these values based on your logo's dimensions
                    height={100}
                    priority  // This loads the image immediately as it's above the fold
                />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                Never Miss a Paint Deal
            </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Track prices on top paint brands. Get notified when prices drop. Save money on your next painting project.
                        </p>
                        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                            <div className="rounded-md shadow">
                                <Link
                                    href="/login"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <PaintBucket className="h-8 w-8 text-blue-500" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Top Paint Brands</h3>
                                <p className="mt-2 text-sm text-gray-500">Track prices from Dulux, Crown, Johnstone's and more.</p>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <Bell className="h-8 w-8 text-blue-500" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Price Drop Alerts</h3>
                                <p className="mt-2 text-sm text-gray-500">Get notified instantly when prices drop on your tracked items.</p>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <TrendingDown className="h-8 w-8 text-blue-500" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Price History</h3>
                                <p className="mt-2 text-sm text-gray-500">See price trends and find the best time to buy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Example Savings */}
            <div className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Example Savings
                    </h2>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500">
                        See how much you could save by tracking paint prices
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {exampleProducts.map((product) => (
                            <div key={product.id} className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="p-6">
                                    <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden mb-4">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.title}
                                            className="w-full h-48 object-contain"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                            {product.title}
                                        </h3>
                                        <div className="mt-2 flex items-center">
                                            <span className="text-2xl font-bold text-green-600">
                                                £{product.currentPrice.toFixed(2)}
                                            </span>
                                            <span className="ml-2 text-sm line-through text-gray-500">
                                                £{product.previousPrice.toFixed(2)}
                                            </span>
                                            <span className="ml-2 text-sm text-green-600 font-medium">
                                                Save {product.savings}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <Link
                                            href="/dashboard"
                                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Track Similar Products <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-blue-700">
                <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        <span className="block">Start saving on paint today</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-blue-200">
                        Join thousands of DIY enthusiasts and professional decorators who save money with Paint Price Tracker.
                    </p>
                    <Link
                        href="/login"
                        className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
                    >
                        Sign up now
                    </Link>
                </div>
            </div>
        </div>
    )
}