import fs from 'fs/promises';
import path from 'path';

const SEED_FILE = path.resolve(process.cwd(), '../data/seed/templates.json');

export async function ensureSeedData() {
  try {
    await fs.access(SEED_FILE);
  } catch (error) {
    const dirPath = path.dirname(SEED_FILE);
    await fs.mkdir(dirPath, { recursive: true });

    const defaultTemplates = [
      {
        id: "tpl-hero-1",
        type: "hero",
        name: "Hero Section",
        defaultData: {
          headline: "Build Something Amazing",
          subheadline: "The best tool for the job. Get started today and see the difference.",
          ctaText: "Get Started"
        }
      },
      {
        id: "tpl-feat-1",
        type: "features",
        name: "Features Grid",
        defaultData: {
          title: "Why Choose Us?",
          items: [
            "Blazing fast performance",
            "Fully responsive design",
            "SEO optimized out of the box"
          ]
        }
      }
    ];

    await fs.writeFile(SEED_FILE, JSON.stringify(defaultTemplates, null, 2), 'utf-8');
  }
}
