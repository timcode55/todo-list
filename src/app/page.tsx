import { TodoApp } from "@/components/todo/todo-app";

export default function Page() {
  return (
    <div className="min-h-screen pb-8 sm:pb-16">
      <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-10">
        <div className="glass soft-border card-shadow rounded-3xl p-8 sm:p-10">
          <TodoApp />
        </div>
      </section>
    </div>
  );
}
