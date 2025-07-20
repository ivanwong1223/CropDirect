import React from 'react';
import Image from 'next/image';
import { Marquee } from '@/components/magicui/marquee';

interface TestimonialCard {
  id: number;
  companyLogo: string;
  userAvatar: string;
  userName: string;
  companyName: string;
  feedback: string;
}

const testimonials: TestimonialCard[] = [
  {
    id: 1,
    companyLogo: '/images/logo1.png',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    userName: 'John Smith',
    companyName: 'Fresh Farms Co.',
    feedback: '"CropDirect has revolutionized how we connect with buyers. The platform is intuitive, and we\'ve seen a 40% increase in our sales since joining."'
  },
  {
    id: 2,
    companyLogo: '/images/logo2.png',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    userName: 'Sarah Johnson',
    companyName: 'Global Foods Ltd.',
    feedback: '"Finding reliable suppliers was always a challenge until we discovered CropDirect. The quality verification process gives us confidence."'
  },
  {
    id: 3,
    companyLogo: '/images/logo3.jpg',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    userName: 'Michael Chen',
    companyName: 'Harvest Solutions',
    feedback: '"The transparency in pricing and the ability to negotiate directly with suppliers has transformed our procurement process."'
  },
  {
    id: 4,
    companyLogo: '/images/logo1.png',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    userName: 'Emily Rodriguez',
    companyName: 'AgriTech Innovations',
    feedback: '"CropDirect\'s platform has streamlined our entire supply chain."'
  },
  {
    id: 5,
    companyLogo: '/images/logo2.png',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    userName: 'David Thompson',
    companyName: 'Organic Valley Farms',
    feedback: '"As a small farm, CropDirect gave us access to markets we never thought possible."'
  },
  {
    id: 6,
    companyLogo: '/images/logo3.jpg',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    userName: 'Lisa Wang',
    companyName: 'Metro Restaurant Group',
    feedback: '"The quality of produce we source through CropDirect is exceptional. Our customers notice the difference."'
  }
];

const TestimonialCard: React.FC<{ testimonial: TestimonialCard }> = ({ testimonial }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mx-4 w-80 h-[390px] flex-shrink-0 flex flex-col">
      {/* Company Logo */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 relative">
          <Image
            src={testimonial.companyLogo}
            alt={`${testimonial.companyName} logo`}
            fill
            className="object-contain"
          />
        </div>
      </div>
      
      {/* User Profile */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-12 h-12 relative mb-2">
          <Image
            src={testimonial.userAvatar}
            alt={testimonial.userName}
            fill
            className="object-cover rounded-full"
          />
        </div>
      </div>
      
      {/* Feedback */}
      <p className="text-gray-700 text-sm leading-relaxed text-center flex-grow">
        {testimonial.feedback}
      </p>

      <div className='flex flex-col items-center mt-auto'>
        <h4 className="font-semibold text-gray-900 text-sm">{testimonial.userName}</h4>
        <p className="text-gray-500 text-xs">{testimonial.companyName}</p>
      </div>

    </div>
  );
};

const Testimonial: React.FC = () => {
  return (
    <section 
      className="py-20 relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 35%), url(/testimonials-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      
      {/* Header - Contained width */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-8 mt-17">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What People Say
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto font-semibold">
            Our customers are our top priority, lets hear what they have to say.
          </p>
        </div>
      </div>
      
      {/* Testimonials Marquee - Full width */}
      <div className="relative z-10 w-full">
        <Marquee className="py-4" pauseOnHover={false}>
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default Testimonial;