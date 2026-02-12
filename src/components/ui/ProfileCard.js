import Link from 'next/link';

export default function ProfileCard({ profile }) {
    return (
        <Link href={`/listings/${profile.id}`} className="group block relative overflow-hidden bg-[#1a1a1a] aspect-[3/4]">
            {/* Profile Image */}
            <img
                src={profile.image}
                alt={profile.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Online Indicator */}
            {profile.isOnline && (
                <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="text-white font-semibold text-sm truncate group-hover:text-red-500 transition-colors">
                    {profile.name}
                </h3>
                <p className="text-gray-400 text-xs truncate">
                    {profile.location}
                </p>
            </div>
        </Link>
    );
}
