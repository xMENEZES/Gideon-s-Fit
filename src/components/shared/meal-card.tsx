"use client";

import { Clock } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddMealItemDialog } from "@/components/shared/add-meal-item-dialog";
import { AddMealOptionDialog } from "@/components/shared/add-meal-option-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteMeal, deleteMealItem, deleteMealOption } from "@/lib/actions/meals";

export type MealWithOptions = {
  id: string;
  name: string;
  suggested_time: string | null;
  meal_options: {
    id: string;
    label: string;
    meal_items: {
      id: string;
      food_name: string;
      quantity: number;
      unit: string;
      notes: string | null;
      sort_order: number;
    }[];
  }[];
};

export function MealCard({
  meal,
  studentId,
  editable,
}: {
  meal: MealWithOptions;
  studentId: string;
  editable: boolean;
}) {
  const showOptionLabels = meal.meal_options.length > 1;
  const singleOption = !showOptionLabels ? meal.meal_options[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {meal.name}
          {meal.suggested_time && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="size-3" />
              {meal.suggested_time.slice(0, 5)}
            </Badge>
          )}
        </CardTitle>
        {editable && (
          <CardAction className="flex items-center gap-1">
            {singleOption && (
              <AddMealItemDialog studentId={studentId} mealOptionId={singleOption.id} />
            )}
            <AddMealOptionDialog studentId={studentId} mealId={meal.id} />
            <ConfirmDeleteButton
              confirmMessage={`Remover a refeição "${meal.name}" e todos os seus itens?`}
              action={() => deleteMeal(studentId, meal.id)}
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent
        className={
          showOptionLabels ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"
        }
      >
        {meal.meal_options.map((option, index) => (
          <div key={option.id} className={showOptionLabels ? "flex flex-col gap-2" : "contents"}>
            {showOptionLabels && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{option.label || `Opção ${index + 1}`}</p>
                {editable && (
                  <div className="flex items-center gap-1">
                    <AddMealItemDialog studentId={studentId} mealOptionId={option.id} />
                    <ConfirmDeleteButton
                      confirmMessage={`Remover a opção "${option.label || `Opção ${index + 1}`}" e todos os seus itens?`}
                      action={() => deleteMealOption(studentId, option.id)}
                    />
                  </div>
                )}
              </div>
            )}
            {option.meal_items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alimento cadastrado ainda.</p>
            ) : (
              [...option.meal_items]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.food_name}{" "}
                        <span className="text-sm text-muted-foreground">
                          — {item.quantity} {item.unit}
                        </span>
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                      )}
                    </div>
                    {editable && (
                      <ConfirmDeleteButton
                        confirmMessage={`Remover "${item.food_name}"?`}
                        action={() => deleteMealItem(studentId, item.id)}
                      />
                    )}
                  </div>
                ))
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
