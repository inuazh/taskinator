"use client";

import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { createCard } from "@/entities/card/api/cardApi";
import toast from "react-hot-toast";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCardModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCardModalProps) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Название обязательно");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await createCard({ title, link: link || undefined });
      setTitle("");
      setLink("");
      toast.success("Карточка создана");
      onCreated();
      onClose();
    } catch {
      toast.error("Ошибка создания карточки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новая карточка">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Имя клиента / название сделки"
          required
        />

        <Input
          label="Ссылка (необязательно)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://t.me/username"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={loading}>
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
}
