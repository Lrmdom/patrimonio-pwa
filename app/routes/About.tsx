import React from 'react';
import {useTranslation} from 'react-i18next';
import {Shield, Award, Clock, Users, Trophy} from 'lucide-react';


export default function About() {
    const {t} = useTranslation();

    const features = [
        {
            icon: <Shield className="w-12 h-12 text-gray-400"/>,
            title: 'Safety First',
            description: 'All our motorcycles are regularly maintained and inspected for your safety.'
        },
        {
            icon: <Award className="w-12 h-12 text-gray-400"/>,
            title: 'Premium Fleet',
            description: 'We offer only the best motorcycles from renowned manufacturers.'
        },
        {
            icon: <Clock className="w-12 h-12 text-gray-400"/>,
            title: '24/7 Support',
            description: 'Our team is always available to assist you whenever you need help.'
        }
    ];

    return (
        <>

            <div className="pt-16">

                <div className="relative">
                    <div className="absolute inset-0">
                        <img
                            className="w-full h-96 object-cover"
                            src="https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&q=80"
                            alt="About us hero"
                        />
                        <div className="absolute inset-0 bg-black opacity-75"></div>
                    </div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center opacity-50">
                        <h1 className="text-4xl font-bold text-gray-300 mb-4">
                            {t('about.title')}
                        </h1>
                        <p className="text-xl text-gray-300">
                            {t('about.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">


                    <div className="text-center mb-16">
                        <div className="container mx-auto px-6 py-12">
                            <h1 className="text-4xl font-bold mb-8">About RideRental</h1>
                            <div className="prose max-w-none">
                                <p className="text-xl text-gray-300 mb-8">
                                    RideRental is your premier destination for motorcycle and scooter rentals, providing
                                    unforgettable two-wheel experiences since 2020.
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-lg text-gray-400">
                            {t('about.description')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center p-6 bg-gray-800 rounded-lg shadow-xl">
                                <div className="flex justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-6 py-12">

                <div className="prose max-w-none">


                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-black"/>
                            <h3 className="text-xl font-semibold mb-2">Safety First</h3>
                            <p className="text-gray-300">All our vehicles undergo rigorous safety inspections and are
                                fully insured.</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <Users className="w-12 h-12 mx-auto mb-4 text-black"/>
                            <h3 className="text-xl font-semibold mb-2">Expert Team</h3>
                            <p className="text-gray-300">Our staff consists of passionate riders with years of
                                experience.</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <Trophy className="w-12 h-12 mx-auto mb-4 text-black"/>
                            <h3 className="text-xl font-semibold mb-2">Quality Service</h3>
                            <p className="text-gray-300">Recognized as the top motorcycle rental service in the
                                region.</p>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold mb-4">Our Story</h2>
                    <p className="text-gray-300 mb-6">
                        Founded by motorcycle enthusiasts, RideRental began with a simple mission: to make premium
                        two-wheel experiences accessible to everyone. What started as a small fleet of motorcycles has
                        grown into a comprehensive collection of bikes and scooters, serving thousands of happy riders
                        each year.
                    </p>

                    <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                    <p className="text-gray-300 mb-6">
                        We're committed to providing safe, reliable, and exciting rental experiences while promoting the
                        joy of two-wheel transportation. Our goal is to make every ride memorable, whether you're a
                        seasoned rider or just starting your two-wheel journey.
                    </p>
                </div>
            </div>
        </>
    );
}