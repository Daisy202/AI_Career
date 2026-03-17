import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star, CheckCircle2, MessageSquareHeart } from "lucide-react";
import { Button, Card, Textarea, Input, Label, Checkbox } from "@/components/ui-elements";
import { useSubmitFeedback } from "@workspace/api-client-react";

const feedbackSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  careerName: z.string().optional(),
  comment: z.string().min(5, "Please provide a bit more detail").optional().or(z.literal('')),
  helpful: z.boolean()
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      careerName: "",
      comment: "",
      helpful: true
    }
  });

  const rating = watch("rating");

  const { mutate, isPending } = useSubmitFeedback({
    mutation: {
      onSuccess: () => setSubmitted(true)
    }
  });

  const onSubmit = (data: FeedbackFormValues) => {
    mutate({ data });
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="p-10 max-w-md text-center bg-white/80 backdrop-blur-xl border-green-500/20 shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
          <p className="text-muted-foreground mb-8 text-lg">Your feedback helps us improve the AI recommendations for all students in Zimbabwe.</p>
          <Button onClick={() => window.location.href = '/'} className="w-full">Return Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
            <MessageSquareHeart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Help Us Improve</h1>
          <p className="text-lg text-muted-foreground">How was your experience with CareerGuideZW?</p>
        </div>

        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Star Rating */}
            <div className="text-center">
              <Label className="text-lg block mb-4">How accurate were the recommendations?</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValue("rating", star, { shouldValidate: true })}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-2 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredStar || rating)
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted-foreground/30"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="text-destructive font-semibold text-sm mt-2">{errors.rating.message}</p>}
            </div>

            <div className="h-px bg-border/50" />

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="careerName" className="mb-2 block">Which career were you recommended? (Optional)</Label>
                <Controller
                  name="careerName"
                  control={control}
                  render={({ field }) => <Input {...field} id="careerName" placeholder="e.g. Software Engineer" />}
                />
              </div>

              <div>
                <Label htmlFor="comment" className="mb-2 block">What could be better? (Optional)</Label>
                <Controller
                  name="comment"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      {...field} 
                      id="comment" 
                      placeholder="Tell us what you liked or what was missing..."
                      className="min-h-[120px]"
                    />
                  )}
                />
                {errors.comment && <p className="text-destructive font-semibold text-sm mt-2">{errors.comment.message}</p>}
              </div>

              <Controller
                name="helpful"
                control={control}
                render={({ field }) => (
                  <Label className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-muted/30 cursor-pointer">
                    <Checkbox 
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="font-semibold">I found this tool helpful for my career planning.</span>
                  </Label>
                )}
              />
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-14" isLoading={isPending}>
              Submit Feedback
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
