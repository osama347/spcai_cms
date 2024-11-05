import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, AlertTriangle, Coffee } from 'lucide-react'

// Utility function to get a seeded random item
function getSeededRandomItem(array: string[], seed: number): string {
  return array[seed % array.length]
}

export default function Hero() {
  const currentDate = new Date()
  const dateSeed = currentDate.getFullYear() * 10000 + (currentDate.getMonth() + 1) * 100 + currentDate.getDate()

  const adminJokes = [
    "Why did the admin cross the road? To restart the chicken server!",
    "What's an admin's favorite drink? Rootbeer!",
    "How many admins does it take to change a light bulb? None, that's a hardware issue!",
    "Why don't admins ever get sick? They have daily backups!",
  ]

  const adminTips = [
    "Always double-check your database queries before running them.",
    "Set up automated backups to save yourself from future headaches.",
    "Document your processes - your future self will thank you.",
    "Take regular breaks to avoid burnout and maintain productivity.",
  ]

  const adminReminders = [
    "Update the security patches by end of week.",
    "Schedule the monthly team meeting for next Monday.",
    "Review and approve pending user registrations.",
    "Check the server logs for any unusual activities.",
  ]

  const dailyJoke = getSeededRandomItem(adminJokes, dateSeed)
  const dailyTip = getSeededRandomItem(adminTips, dateSeed + 1)
  const dailyReminder = getSeededRandomItem(adminReminders, dateSeed + 2)

  return (
    <div className=" bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary animate-bounce">
            Welcome, Almighty Admin!
          </CardTitle>
          <p className="text-center text-muted-foreground">
            It's {currentDate.toLocaleDateString()} - Time for some admin fun!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
              <Coffee className="w-6 h-6" />
              Daily Dose of Admin Humor
            </h2>
            <p className="text-muted-foreground italic">
              "{dailyJoke}"
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
              <Lightbulb className="w-6 h-6" />
              Admin Tip of the Day
            </h2>
            <p className="text-muted-foreground">
              {dailyTip}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
              <AlertTriangle className="w-6 h-6" />
              Important Reminder
            </h2>
            <p className="text-muted-foreground">
              {dailyReminder}
            </p>
          </section>

          <p className="text-center text-sm text-muted-foreground animate-pulse mt-6">
            Remember: With great power comes great responsibility... and a lot of coffee!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}