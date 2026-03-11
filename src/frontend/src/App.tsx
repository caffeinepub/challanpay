import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  IndianRupee,
  Loader2,
  MapPin,
  Search,
  Shield,
  Tag,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Challan } from "./backend.d";
import { Status } from "./backend.d";
import {
  useGetChallansByVehicle,
  usePayChallan,
  useSeedSampleData,
} from "./hooks/useQueries";

const queryClient = new QueryClient();

const EXAMPLE_VEHICLES = ["MH12AB1234", "DL3CAF9087", "KA05MG7654"];

function formatCurrency(amount: bigint): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function getViolationIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("speed")) return "🚦";
  if (lower.includes("red") || lower.includes("signal")) return "🔴";
  if (lower.includes("park")) return "🅿️";
  if (lower.includes("belt") || lower.includes("seatbelt")) return "🛡️";
  if (lower.includes("phone") || lower.includes("mobile")) return "📱";
  return "⚠️";
}

function PaymentModal({
  challan,
  open,
  onClose,
  onConfirm,
  isLoading,
  isPaid,
}: {
  challan: Challan | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isPaid: boolean;
}) {
  if (!challan) return null;
  const savings = challan.fineAmount - challan.discountedAmount;
  const discountPct = Math.round(
    (Number(savings) / Number(challan.fineAmount)) * 100,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-ocid="payment.dialog">
        <AnimatePresence mode="wait">
          {isPaid ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 gap-4"
              data-ocid="payment.success_state"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>
              <div className="text-center">
                <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                  Payment Successful!
                </h3>
                <p className="text-muted-foreground text-sm">
                  Challan #{challan.id.toString()} has been cleared
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 w-full text-center">
                <p className="text-sm text-muted-foreground">You saved</p>
                <p className="font-display font-bold text-2xl text-success">
                  {formatCurrency(savings)}
                </p>
                <p className="text-xs text-muted-foreground">
                  with our {discountPct}% discount
                </p>
              </div>
              <Button
                onClick={onClose}
                className="w-full"
                data-ocid="payment.close_button"
              >
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-5"
            >
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Confirm Payment
                </DialogTitle>
              </DialogHeader>

              <div className="bg-muted/60 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {getViolationIcon(challan.violationType)}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {challan.violationType}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {challan.location}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {challan.date}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Original Fine
                  </span>
                  <span className="line-through text-muted-foreground">
                    {formatCurrency(challan.fineAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Discount ({discountPct}%)
                  </span>
                  <span className="text-success font-medium">
                    −{formatCurrency(savings)}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">
                    Amount to Pay
                  </span>
                  <span className="font-display font-bold text-2xl text-primary">
                    {formatCurrency(challan.discountedAmount)}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Limited time offer — pay now & save {formatCurrency(savings)}!
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isLoading}
                  data-ocid="payment.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={onConfirm}
                  disabled={isLoading}
                  data-ocid="payment.confirm_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-4 h-4 mr-2" /> Pay{" "}
                      {formatCurrency(challan.discountedAmount)}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ChallanCard({
  challan,
  index,
  onPay,
}: { challan: Challan; index: number; onPay: (c: Challan) => void }) {
  const isPending = challan.status === Status.pending;
  const savings = challan.fineAmount - challan.discountedAmount;
  const discountPct = Math.round(
    (Number(savings) / Number(challan.fineAmount)) * 100,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      data-ocid={`challan.item.${index + 1}`}
    >
      <Card className="shadow-card hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <CardContent className="p-0">
          <div
            className={`h-1 w-full ${isPending ? "bg-amber-400" : "bg-green-500"}`}
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                  {getViolationIcon(challan.violationType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-foreground">
                      {challan.violationType}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium shrink-0 ${
                        isPending
                          ? "border-amber-400 text-amber-600 bg-amber-50"
                          : "border-green-500 text-green-600 bg-green-50"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-2.5 h-2.5 mr-1" /> Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Paid
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{challan.location}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />{" "}
                      {challan.date}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />{" "}
                      {challan.officerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(challan.fineAmount)}
                  </p>
                  <p className="font-display font-bold text-xl text-foreground">
                    {formatCurrency(challan.discountedAmount)}
                  </p>
                </div>
                {isPending && (
                  <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs font-bold">
                    {discountPct}% OFF
                  </Badge>
                )}
                {isPending ? (
                  <Button
                    size="sm"
                    onClick={() => onPay(challan)}
                    className="gap-1.5"
                    data-ocid={`challan.pay_button.${index + 1}`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" /> Pay Now
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Cleared
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryBar({ challans }: { challans: Challan[] }) {
  const pending = challans.filter((c) => c.status === Status.pending);
  const totalDue = pending.reduce((acc, c) => acc + c.discountedAmount, 0n);
  const totalSavings = pending.reduce(
    (acc, c) => acc + (c.fineAmount - c.discountedAmount),
    0n,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-4 mb-6"
    >
      {[
        {
          icon: <AlertCircle className="w-5 h-5" />,
          label: "Challans Found",
          value: challans.length.toString(),
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          icon: <IndianRupee className="w-5 h-5" />,
          label: "Total Dues",
          value: formatCurrency(totalDue),
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          icon: <Tag className="w-5 h-5" />,
          label: "Total Savings",
          value: formatCurrency(totalSavings),
          color: "text-success",
          bg: "bg-green-50",
        },
      ].map((stat) => (
        <Card key={stat.label} className="shadow-card">
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div
              className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}
            >
              {stat.icon}
            </div>
            <p
              className={`font-display font-bold text-lg leading-tight ${stat.color}`}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function MainApp() {
  const [searchInput, setSearchInput] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState<string | null>(null);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paidChallanId, setPaidChallanId] = useState<bigint | null>(null);

  const {
    data: challans,
    isLoading,
    isError,
  } = useGetChallansByVehicle(vehicleNumber);
  const { mutate: seedData, isPending: isSeeding } = useSeedSampleData();
  const { mutate: payChallan, isPending: isPaying } = usePayChallan();

  const handleSearch = () => {
    const trimmed = searchInput.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a vehicle registration number");
      return;
    }
    setVehicleNumber(trimmed);
    setPaidChallanId(null);
  };

  const handlePay = (challan: Challan) => {
    setSelectedChallan(challan);
    setPaidChallanId(null);
    setPaymentOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedChallan) return;
    payChallan(selectedChallan.id, {
      onSuccess: () => {
        setPaidChallanId(selectedChallan.id);
        toast.success("Challan paid successfully!");
      },
      onError: () => {
        toast.error("Payment failed. Please try again.");
      },
    });
  };

  const isPaid =
    selectedChallan !== null && paidChallanId === selectedChallan.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-xs sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-foreground tracking-tight">
                Challan
              </span>
              <span className="font-display font-bold text-xl text-primary tracking-tight">
                Pay
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground hidden sm:flex"
            >
              <Zap className="w-3 h-3 mr-1 text-amber-500" /> Official Portal
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => seedData()}
              disabled={isSeeding}
              className="text-xs text-muted-foreground"
            >
              {isSeeding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Load Demo Data"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom right, oklch(0.28 0.08 265), oklch(0.18 0.06 265)), url('/assets/generated/challan-hero-bg.dim_1600x600.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.45_0.18_265_/_0.2)_0%,_transparent_60%)]" />
        <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5">
              <Tag className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-semibold text-amber-200 tracking-wide uppercase">
                Up to 30% Discount on All Challans
              </span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-tight mb-4">
              Find & Pay Your
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #93c5fd, #a5f3fc)",
                }}
              >
                Vehicle Challans
              </span>
            </h1>
            <p className="text-blue-200 text-lg mb-8 leading-relaxed">
              Search by vehicle registration number. Get instant access to
              pending challans and pay at a discount.
            </p>

            {/* Search box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex gap-2 shadow-modal">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter vehicle number e.g. MH12AB1234"
                className="flex-1 bg-transparent border-0 text-white placeholder:text-blue-300 focus-visible:ring-0 text-base font-medium h-12"
                data-ocid="search.input"
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl font-semibold text-sm gap-2 shrink-0"
                data-ocid="search.primary_button"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Search
                  </>
                )}
              </Button>
            </div>

            {/* Example vehicles */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-blue-300">Try:</span>
              {EXAMPLE_VEHICLES.map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => {
                    setSearchInput(v);
                    setVehicleNumber(v);
                  }}
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-blue-200 px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Car className="w-3 h-3" /> {v}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works (shown when no search) */}
      <AnimatePresence>
        {!vehicleNumber && (
          <motion.section
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border-b border-border"
          >
            <div className="container max-w-5xl mx-auto px-4 py-12">
              <h2 className="font-display font-bold text-2xl text-foreground mb-8 text-center">
                How it works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: "01",
                    icon: <Car className="w-6 h-6" />,
                    title: "Enter Vehicle Number",
                    desc: "Type your vehicle registration number in the search box above.",
                  },
                  {
                    step: "02",
                    icon: <AlertCircle className="w-6 h-6" />,
                    title: "View Pending Challans",
                    desc: "Instantly see all traffic violations linked to your vehicle.",
                  },
                  {
                    step: "03",
                    icon: <IndianRupee className="w-6 h-6" />,
                    title: "Pay at a Discount",
                    desc: "Clear your dues with up to 30% discount through our portal.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex gap-4"
                  >
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {item.icon}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground tracking-widest">
                        {item.step}
                      </span>
                      <h3 className="font-display font-semibold text-foreground mt-0.5">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && vehicleNumber && (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-ocid="challan.loading_state"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">
              Searching challans for{" "}
              <span className="font-bold text-foreground">{vehicleNumber}</span>
              ...
            </p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div
            className="flex flex-col items-center py-16 gap-3"
            data-ocid="challan.error_state"
          >
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-foreground font-semibold">
              Something went wrong
            </p>
            <p className="text-sm text-muted-foreground">
              Please try again or contact support.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !isError && challans !== undefined && vehicleNumber && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 flex items-center justify-between"
            >
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground">
                  Results for{" "}
                  <span className="text-primary">{vehicleNumber}</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {challans.length} challan{challans.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVehicleNumber(null);
                  setSearchInput("");
                }}
                className="gap-1.5 text-sm"
              >
                <Search className="w-3.5 h-3.5" /> New Search
              </Button>
            </motion.div>

            {challans.length > 0 && <SummaryBar challans={challans} />}

            {/* Empty state */}
            {challans.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-20 gap-4"
                data-ocid="challan.empty_state"
              >
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-xl text-foreground">
                    No Challans Found
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Great news! No pending challans for{" "}
                    <span className="font-semibold">{vehicleNumber}</span>.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Try loading demo data to see challans.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4" data-ocid="challan.list">
                {challans.map((challan, i) => (
                  <ChallanCard
                    key={challan.id.toString()}
                    challan={challan}
                    index={i}
                    onPay={handlePay}
                  />
                ))}
              </div>
            )}

            {/* Notice banner */}
            {challans.some((c) => c.status === Status.pending) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Discount valid for limited time
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Pay your challans now to avail up to 30% discount. Delayed
                    payment may result in additional penalties.
                  </p>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Initial state - no search yet */}
        {!vehicleNumber && (
          <div className="flex flex-col items-center py-12 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <p className="font-display font-semibold text-lg text-foreground">
              Enter your vehicle number above
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              We'll fetch all challans associated with your vehicle and show
              available discounts.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => {
                setSearchInput("MH12AB1234");
                setVehicleNumber("MH12AB1234");
              }}
            >
              <ChevronRight className="w-4 h-4" /> Try demo: MH12AB1234
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-sm text-foreground">
              ChallanPay
            </span>
            <span className="text-xs text-muted-foreground">
              — Official Vehicle Challan Portal
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        challan={selectedChallan}
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          setPaidChallanId(null);
        }}
        onConfirm={handleConfirmPayment}
        isLoading={isPaying}
        isPaid={isPaid}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}
