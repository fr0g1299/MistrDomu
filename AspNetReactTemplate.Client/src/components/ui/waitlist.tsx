import { useCallback, useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const getWaitlistText = (count: number) => {
	const rule = new Intl.PluralRules("cs-CZ").select(count);

	const mapping = {
		one: { verb: "čeká", noun: "kutil" },
		few: { verb: "čekají", noun: "kutilové" },
		other: { verb: "čeká", noun: "kutilů" },
	};

	return mapping[rule as keyof typeof mapping] || mapping.other;
};

export function Waitlist() {
	const [email, setEmail] = useState("");
	const [waitlistCount, setWaitlistCount] = useState<number>(0);
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [message, setMessage] = useState("");

	const { verb, noun } = getWaitlistText(waitlistCount);

	const fetchWaitlistCount = useCallback(async () => {
		try {
			const response = await fetch("/api/waitlist/count");
			if (response.ok) {
				const data = await response.json();
				setWaitlistCount(data.count);
			}
		} catch (error) {
			console.error("Error fetching waitlist count:", error);
		}
	}, []);

	useEffect(() => {
		fetchWaitlistCount();
	}, [fetchWaitlistCount]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!email || status === "loading") return;

		setStatus("loading");
		setMessage("");

		try {
			const response = await fetch("/api/waitlist", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			if (response.ok) {
				setStatus("success");
				setMessage("Děkujeme! Jste na čekací listině.");
				setEmail("");
				fetchWaitlistCount();
			} else {
				const errorData = await response.text();
				setStatus("error");
				setMessage(errorData || "Něco se nepovedlo. Zkuste to později.");
			}
		} catch (error) {
			console.error("Error joining waitlist:", error);
			setStatus("error");
			setMessage("Chyba připojení k serveru.");
		}
	};

	return (
		<div className="w-full max-w-104 rounded-3xl border-2 border-primary bg-background/90 dark:bg-zinc-900/85 backdrop-blur-sm p-3.5 md:p-4 shadow-[0_0_24px_rgba(245,158,11,0.35)] dark:shadow-[0_0_20px_rgba(245,158,11,0.28)] transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(245,158,11,0.7)] dark:hover:shadow-[0_0_40px_rgba(245,158,11,0.56)]">
			<div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
				<span className="relative flex h-2 w-2">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75"></span>
					<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
				</span>
				<span>
					Na waitlistu {verb} již{" "}
					<strong className="font-semibold">
						{waitlistCount.toLocaleString("cs-CZ")}
					</strong>{" "}
					{noun}
				</span>
			</div>

			<form
				onSubmit={handleSubmit}
				className="flex flex-col sm:flex-row w-full gap-1.5"
			>
				<div className="relative flex-1 flex items-center rounded-2xl bg-white dark:bg-zinc-900 border border-black/15 dark:border-zinc-700">
					<Mail className="absolute left-3 text-zinc-500 dark:text-zinc-200 w-5 h-5" />
					<Input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Váš email"
						className="pl-10 h-11 border-0 bg-transparent text-zinc-900 dark:text-zinc-100 focus-visible:ring-0 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
					/>
				</div>
				<Button
					type="submit"
					disabled={status === "loading"}
					className="h-11 bg-primary text-zinc-950 hover:bg-primary/90 px-7 rounded-2xl font-semibold w-full sm:w-auto"
				>
					{status === "loading" ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						"Připojit se"
					)}
				</Button>
			</form>

			{message && (
				<p
					className={`text-center text-sm mt-3 ${status === "success" ? "text-emerald-900" : "text-destructive"}`}
				>
					{message}
				</p>
			)}
		</div>
	);
}
