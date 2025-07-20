'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import Link from "next/link";
import Image from "next/image";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { TfiArrowTopRight } from "react-icons/tfi";
import { FaStore, FaChartLine, FaCogs } from "react-icons/fa";
import { LuCoins } from 'react-icons/lu';
import { PiPlantFill } from "react-icons/pi";
import { MdOutlineInsights } from "react-icons/md";
import { PiFeatherLight } from "react-icons/pi";
import { FaShippingFast } from "react-icons/fa";
import { MdOutlineConnectWithoutContact } from "react-icons/md";
import { FaNewspaper } from "react-icons/fa6";
import { FaCartArrowDown } from "react-icons/fa";
import { AiFillInsurance } from "react-icons/ai";
import { IoIosChatboxes } from "react-icons/io";
import { FaIdBadge } from "react-icons/fa";
import FAQ from '@/components/landing-page/FAQ';
import MarqueeSection from '@/components/landing-page/Marquee';
import Testimonial from '@/components/landing-page/Testimonial';

export default function Home() {
  const [activeTab, setActiveTab] = useState('agribusiness');

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative max-h-screen w-full">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="https://herovideo-cropdirect.s3.us-east-1.amazonaws.com/HeroVideo1.mp4" type="video/mp4" />
        </video>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col lg:flex-row items-end justify-between min-h-screen text-white p-8 pb-20 lg:p-24 lg:pb-32">
          {/* Left Content */}
          <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start space-x-4">
              <span className="flex items-center gap-2"><PiFeatherLight />Driven</span>
              <span className="flex items-center gap-2"><PiFeatherLight />Rooted</span>
              <span className="flex items-center gap-2"><PiFeatherLight />Impactful</span>
            </div>
            <p className="text-xl md:text-2xl max-w-lg">
              A modern agricultural portal streamlining trading process and enhance profitability. Pioneering the fusion of technology and sustainability
            </p>
            <div className="flex justify-center lg:justify-start space-x-4">
              <button className="bg-[#E6F3D6] text-black px-6 py-3 rounded-lg flex items-center space-x-2 cursor-pointer border-2 border-transparent hover:bg-transparent hover:border-yellow-400 hover:text-yellow-400 transition-all duration-300">
                <IoMdInformationCircleOutline className="text-lg" />
                <span>Discover More</span>
              </button>
              <button className="relative flex items-center gap-1 bg-neutral-900 px-9 py-3 border-2 border-transparent space-x-2 text-base rounded-lg font-semibold text-white cursor-pointer overflow-hidden transition-all duration-600 ease-custom hover:bg-yellow-400 hover:text-black group">
                <svg viewBox="0 0 24 24" className="absolute w-6 fill-white z-[9] transition-all duration-700 ease-custom -left-1/4 group-hover:left-4 group-hover:fill-black" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="relative z-[1] transition-all duration-700 ease-custom -translate-x-3 group-hover:translate-x-3">
                  View Market
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-yellow-400 rounded-full opacity-0 transition-all duration-700 ease-custom group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100"></span>
                <svg viewBox="0 0 24 24" className="absolute w-6 fill-white z-[9] transition-all duration-700 ease-custom right-4 group-hover:-right-1/4 group-hover:fill-yellow-400" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
              </button>
            </div>
          </div>
          {/* Right Content */}
          <div className="lg:w-1/2 text-center lg:text-right mt-10 lg:mt-0">
            <h1 className="text-5xl md:text-7xl font-semibold">
              Where Innovation
            </h1>
            <h2 className="text-5xl md:text-7xl font-light">
              meets
            </h2>
            <h1 className="text-5xl md:text-7xl font-light">
              Sustainability
            </h1>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative bg-[#F5F9EB] py-10 px-8 lg:py-30 lg:px-33">
        {/* Header Section */}
        <div className="text-left max-w-4xl">
          <p className="text-black text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <PiPlantFill className='text-[#576E35] text-xl'/> Introducing CropDirect

          </p>
          <h1 className="text-3xl lg:text-5xl font-semibold text-black mt-2 leading-tight">
            Revolutionizing Agricultural Trade
          </h1>
          <p className="text-gray-800 text-base mt-4 leading-relaxed max-w-xl">
            A B2B digital marketplace where fair produce trade is made easy, fast and transparent – enabling seamless sales, transparent pricing, and smarter logistics, without middlemen.
          </p>
        </div>

        {/* Card Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-left">
          {/* Card 1 */}
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4">
              <LuCoins className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-black">Direct Market Access – Agribusinesses and Buyers</h3>
            <p className="text-gray-600 mt-2">Unlike traditional crop value chain, we drive agricultural transactions through our digital platform without intermediaries to maximize fair trade.</p>
          </div>

          {/* Card 2 */}
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4">
              <MdOutlineInsights className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-black">Real-Time Crop Listings and Pricing – Smarter Spending</h3>
            <p className="text-gray-600 mt-2">Access up-to-the-minute crop listings and market prices. Make informed decisions with reliable market information on agricultural commodities, enabling strategic buying and selling opportunities.</p>
          </div>

          {/* Card 3 */}
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4">
              <FaShippingFast className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-black">Simplify Agricultural Logistics – Tailored for end-to-end logistic services</h3>
            <p className="text-gray-600 mt-2">Streamline your agricultural supply chain with our integrated logistics solutions from crop produce to business.</p>
          </div>
        </div>
      </section>
      {/* Marquee Company using CropDirect Section */}
      <section className="py-12 bg-[#FAFAFA]">
        <MarqueeSection />
      </section>

      {/* Our Solution */}
      <section className="relative bg-white py-16 px-8 lg:py-24 lg:px-24">
        <div className="text-center max-w-4xl mx-auto pb-10">
          <div className="inline-flex items-center px-6 py-2 bg-white border border-gray-200 rounded-full mb-6">
            <span className="text-sm font-normal tracking-wide text-gray-700">Valuable Features</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-[rgb(14,34,7)] mb-6 leading-tight">
            OUR SOLUTION
          </h1>
          <div className="space-y-8 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            <p className='tracking-wide'>
              A digital crop trading portal solution designed to simplify and optimize agricultural trade. We connect Agribusinesses directly with Industrial Buyers — enabling them to trade efficiently without unnecessary middlemen.
            </p>
            <p className="text-black font-semibold">
              CropDirect does not buy or sell crops and is not a broker. Instead, we offer you the ability to effortlessly market your crop via our platform.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="mt-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Card 1 - Broader Market Reach */}
            <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-3xl p-8 pb-0 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-black">Broader Market Reach</h3>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <MdOutlineConnectWithoutContact className="text-2xl text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Monitor result performance with real time insights.
                </p>
              </div>
              <div className="mt-auto">
                <Image 
                  src="/images/broader_market_reach.png"  
                  alt="Broader Market Reach" 
                  width={332} 
                  height={228}
                  className="w-full h-auto rounded-t-2xl"
                />
              </div>
            </div>

            {/* Card 2 - Content Scheduling */}
            <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-3xl p-8 pb-0 flex flex-col">
              <div className="mb-6">
                <div className='flex items-center justify-between mb-4'>
                  <h3 className="text-xl font-semibold text-black">Real-time Market Intelligence</h3>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <FaNewspaper className="text-2xl text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Stay ahead with up-to-date market data and dynamic pricing insights.
                </p>
              </div>
              <div className="mt-auto">
                <Image 
                  src="/images/content_scheduling.png" 
                  alt="Content Scheduling" 
                  width={332} 
                  height={228}
                  className="w-full h-auto rounded-t-2xl"
                />
              </div>
            </div>

            {/* Card 3 - Team Collaboration */}
            <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-3xl p-8 pb-0 flex flex-col">
              <div className="mb-6">
                <div className='flex items-center justify-between mb-4'>
                  <h3 className="text-xl font-semibold text-black">Seamless Order Management</h3>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <FaCartArrowDown className="text-2xl text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Manage and improve orders effortlessly.
                </p>
              </div>
              <div className="mt-auto">
                <Image 
                  src="/images/team_collaboration.png" 
                  alt="Team Collaboration" 
                  width={332} 
                  height={228}
                  className="w-full h-auto rounded-t-2xl"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto">
            {/* Card 4 - Streamline Communication */}
            <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-3xl p-8 pb-0 flex flex-col">
              <div className="mb-6">
                <div className='flex items-center justify-between mb-4'>
                  <h3 className="text-xl font-semibold text-black">Transparent Trade Process with KYB Verified Sellers</h3>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <AiFillInsurance className="text-2xl text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Build trust through verified seller profiles and protected payment transactions.
                </p>
              </div>
              <div className="mt-auto">
                <Image 
                  src="/images/streamline_communication.png" 
                  alt="Streamline Communication" 
                  width={542} 
                  height={251}
                  className="w-full h-auto rounded-t-2xl"
                />
              </div>
            </div>

            {/* Card 5 - Customizable Dashboards */}
            <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-3xl p-8 pb-0 flex flex-col">
              <div className="mb-6">
                <div className='flex items-center justify-between mb-4'>
                  <h3 className="text-xl font-semibold text-black">Streamline Comunication</h3>
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <IoIosChatboxes className="text-2xl text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Direct communication and negotiations with in-platform chat for trade discussions
                </p>
              </div>
              <div className="mt-auto">
                <Image 
                  src="/images/customizable_dashboards.png" 
                  alt="Customizable Dashboards" 
                  width={542} 
                  height={251}
                  className="w-full h-auto rounded-t-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-30 bg-[#F5F9EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-13">
            <h2 className="text-4xl font-bold text-gray-900 mb-7">HOW IT WORKS</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto tracking-wide">
              Discover how our platform streamlines agricultural trading for both producers and buyers. Solves the inefficiencies in the agricultural value chain.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-25">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('agribusiness')}
                className={`px-8 py-3 rounded-md cursor-pointer font-semibold transition-all duration-300 ${
                  activeTab === 'agribusiness'
                    ? 'bg-green-900 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Agribusinesses
              </button>
              <button
                onClick={() => setActiveTab('buyer')}
                className={`px-8 py-3 rounded-md cursor-pointer font-semibold transition-all duration-300 ${
                  activeTab === 'buyer'
                    ? 'bg-[#00154c] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                For Business Buyers
              </button>
            </div>
          </div>

          {/* Content Sections */}
          {activeTab === 'agribusiness' && (
            <div className="space-y-24">
              {/* Step 1 - Image Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-18 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-900 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                      <FaIdBadge />
                    </div>
                    <h3 className="text-4xl font-semibold text-gray-900">Register & Get Verified</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Create your agribusiness account and complete KYB (Know Your Business) verification. 
                    Our admin team will review and approve your account to ensure marketplace integrity.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Business registration documents
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Identity verification
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Admin approval process
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Image
                      src="/How-it-work.png"
                      alt="Register and Get Verified"
                      width={600}
                      height={500}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 - Image Left */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-18 items-center">
                <div className="order-2 lg:order-1 relative">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Image
                      src="/How-it-work.png"
                      alt="Create Product Listings"
                      width={600}
                      height={500}
                    />
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-900 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                      <FaIdBadge />
                    </div>
                    <h3 className="text-4xl font-semibold text-gray-900">Create Product Listings</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    List your crops with detailed information including category, images, location, 
                    availability, and pricing. Choose from tiered subscription plans to unlock premium features.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Crop category and specifications
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      High-quality product images
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Pricing and availability updates
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 - Image Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-18 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-900 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                      <FaIdBadge />
                    </div>
                    <h3 className="text-4xl font-semibold text-gray-900">Manage Orders & Sales</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Receive quotation requests from buyers, negotiate prices directly, and track order status 
                    from pending to delivered. Access comprehensive sales analytics and market insights.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Direct buyer communication
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Real-time order tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Sales performance dashboard
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Image
                      src="/How-it-work.png"
                      alt="Manage Orders and Sales"
                      width={600}
                      height={500}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 - Image Left */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-18 items-center">
                <div className="order-2 lg:order-1 relative">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Image
                      src="/How-it-work.png"
                      alt="Coordinate Logistics"
                      width={600}
                      height={500}
                    />
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-green-900 text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                      <FaIdBadge />
                    </div>
                    <h3 className="text-4xl font-semibold text-gray-900">Coordinate Logistics</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Select from integrated third-party logistics providers like FedEx and DHL. 
                    Get transparent shipping cost estimates and track shipments in real-time.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Multiple logistics partners
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Transparent cost estimation
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      Real-time shipment tracking
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'buyer' && (
            <div className="space-y-24">
              {/* Step 1 - Image Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      1
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Create Buyer Profile</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Register as a business buyer and create your profile. Access our marketplace of 
                    verified agribusinesses and start discovering quality produce from trusted suppliers.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Quick registration process
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Business profile setup
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Access to verified suppliers
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <Image
                    src="/How-it-work.png"
                    alt="Create Buyer Profile"
                    width={500}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Step 2 - Image Left */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 relative">
                  <Image
                    src="/How-it-work.png"
                    alt="Discover and Browse"
                    width={500}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      2
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Discover & Browse Products</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Browse and search produce listings with advanced filters by category, location, price, 
                    and availability. Discover verified agribusinesses based on your specific requirements.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Advanced search filters
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Location-based discovery
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Verified supplier profiles
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 - Image Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      3
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Request Quotes & Negotiate</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Request quotations for specific produce items and negotiate prices directly with 
                    agribusinesses. Participate in bidding for high-demand or seasonal products.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Direct price negotiation
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Competitive bidding system
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Real-time communication
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <Image
                    src="/How-it-work.png"
                    alt="Request Quotes and Negotiate"
                    width={500}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Step 4 - Image Left */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 relative">
                  <Image
                    src="/How-it-work.png"
                    alt="Purchase and Track"
                    width={500}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      4
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Purchase & Track Orders</h3>
                  </div>
                  <p className="text-lg text-gray-600 mb-6">
                    Place orders and make secure payments via credit card or bank transfer. 
                    Track real-time order progress from payment to delivery with downloadable receipts.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Secure payment options
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Real-time order tracking
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Digital receipts and history
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Faqs Section */}
      <FAQ />
      {/* Testimonials Section */}
      <div>
        <Testimonial />
      </div>
    </div>
  ); 
}
