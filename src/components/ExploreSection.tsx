import { ChevronRight } from 'lucide-react';

interface PersonaCard {
  name: string;
  description: string;
  image: string;
  icon?: string;
}

const personas: PersonaCard[] = [
  {
    name: 'Albert Einstein',
    description: 'Revolutionized science, imagination beyond known limits.',
    image: '👨‍🔬',
  },
  {
    name: 'Career Coach',
    description: 'Assists in achieving career goals with guidance and planning.',
    image: '👩‍💼',
  },
  {
    name: 'Creative Writer',
    description: 'Helps craft compelling stories and engaging content.',
    image: '✍️',
  },
  {
    name: 'Math Tutor',
    description: 'Explains complex mathematical concepts with clarity.',
    image: '📐',
  },
];

export function ExploreSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Explore</h2>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          See more
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Persona Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {personas.map((persona, index) => (
          <button
            key={index}
            className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl hover:bg-accent/50 hover:shadow-lg transition-all duration-200 text-left group"
          >
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center text-4xl mb-4 ring-4 ring-background group-hover:ring-primary/20 transition-all">
              {persona.image}
            </div>

            {/* Name */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {persona.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {persona.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
