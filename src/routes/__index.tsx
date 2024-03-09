import {
	RouteDefinition,
	action,
	cache,
	createAsync,
	createAsyncStore,
	useAction,
	useSubmission,
	useSubmissions,
} from "@solidjs/router";
import { readFile, writeFile } from "fs/promises"
import { createEffect } from "solid-js";

const getStuff = () => {
	"use server"
	return readFile("./stuff", "utf8");
}
const setStuff = async (data: string) => {
	"use server"
	await new Promise((resolve) => setTimeout(resolve, 6000));
	const stuff = await getStuff();
	await writeFile("./stuff", stuff + "\n" + data)
	return true;
}

const update = action(async (value: string) => {
	"use server";
	return setStuff(value);
}, "lol");

const getData = cache(async () => {
	"use server";
	return getStuff();
}, "data")

export const route: RouteDefinition = {
	load: () => getData(),
};

export default function Test() {
	const data = createAsync(() => getData());

	const a = useAction(update);
	const s = useSubmissions(update, () => true);
	
	createEffect(() => {
		console.log(data());
		for(const x of s) {
			console.log(x.input);
		}
	});

	const value = () => {
		const current = data();
		const next = s.pending ? s.map((x) => x.input?.[0]).join("\n") : "";
		return current + "\n" + next;
	}
	return (
		<div>
			<pre>{value()}</pre>
			{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <input id="stuff" type="text" />
			<button onClick={() => a(document.getElementById("stuff")!.value ?? "nothing")}>click</button>
		</div>
	);
}
