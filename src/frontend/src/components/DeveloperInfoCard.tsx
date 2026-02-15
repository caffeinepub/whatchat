import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, FileCode, Rocket, Book } from 'lucide-react';
import { useGetDevDocumentationUrl } from '../hooks/useQueries';

export default function DeveloperInfoCard() {
  const { data: devDocUrl } = useGetDevDocumentationUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Developer Info
        </CardTitle>
        <CardDescription>How to modify and customize this app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Frontend Code</p>
              <p className="text-muted-foreground">
                Edit UI components in <code className="bg-muted px-1 py-0.5 rounded">frontend/src/screens/</code> and{' '}
                <code className="bg-muted px-1 py-0.5 rounded">frontend/src/components/</code>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Book className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Backend Logic</p>
              <p className="text-muted-foreground">
                Messaging and auth logic is in <code className="bg-muted px-1 py-0.5 rounded">backend/main.mo</code>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Rocket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Deploy Changes</p>
              <p className="text-muted-foreground">
                Run <code className="bg-muted px-1 py-0.5 rounded">dfx deploy</code> to deploy your changes to the
                Internet Computer
              </p>
            </div>
          </div>

          {devDocUrl && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">{devDocUrl}</p>
            </div>
          )}
        </div>

        <div className="bg-accent/50 p-4 rounded-lg">
          <p className="text-xs font-medium mb-2">Quick Start:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Clone or access the project repository</li>
            <li>
              Run <code className="bg-muted px-1 py-0.5 rounded">npm install</code> in the frontend directory
            </li>
            <li>
              Start local development with <code className="bg-muted px-1 py-0.5 rounded">dfx start --background</code>
            </li>
            <li>
              Deploy with <code className="bg-muted px-1 py-0.5 rounded">dfx deploy</code>
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
