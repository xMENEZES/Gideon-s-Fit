"use client";

import { ChevronDown, Clock } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddMealItemDialog } from "@/components/shared/add-meal-item-dialog";
import { AddMealOptionDialog } from "@/components/shared/add-meal-option-dialog";
import { CARD_ACTIONS_CLASS } from "@/components/shared/card-actions";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { EditMealDialog } from "@/components/shared/edit-meal-dialog";
import { EditMealItemDialog } from "@/components/shared/edit-meal-item-dialog";
import { EditMealOptionDialog } from "@/components/shared/edit-meal-option-dialog";
import { ChoiceCarousel } from "@/components/shared/choice-carousel";
import { deleteMeal, deleteMealItem, deleteMealOption } from "@/lib/actions/meals";
import { existingGroups, groupMealItems } from "@/lib/meal-groups";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

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
      choice_group: string | null;
      sort_order: number;
    }[];
  }[];
};

type MealItem = MealWithOptions["meal_options"][number]["meal_items"][number];

export function MealCard({
  meal,
  studentId,
  editable,
  tracking,
  headerAction,
  collapsible,
}: {
  meal: MealWithOptions;
  studentId: string;
  editable: boolean;
  // Área abaixo dos alimentos (registro do dia, anotação).
  tracking?: React.ReactNode;
  // Ícones de registro no canto do cabeçalho (só sem edição: com edição o canto tem os botões de editar).
  headerAction?: React.ReactNode;
  // Tela diária: o título vira um botão que recolhe/expande os alimentos. Recolhido, sobra só o
  // cabeçalho (nome, horário, estado) e a anotação do registro. Ignorado com edição.
  collapsible?: {
    collapsed: boolean;
    onToggle: () => void;
    status?: React.ReactNode;
  };
}) {
  const collapsed = !editable && !!collapsible?.collapsed;
  const showOptionLabels = meal.meal_options.length > 1;
  const singleOption = !showOptionLabels ? meal.meal_options[0] : null;

  return (
    <Card id={`meal-${meal.id}`} className={cn("scroll-mt-4", collapsed && "gap-3 py-3")}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {!editable && collapsible ? (
            <button
              type="button"
              onClick={collapsible.onToggle}
              aria-expanded={!collapsed}
              aria-controls={`meal-body-${meal.id}`}
              className="flex min-w-0 flex-wrap items-center gap-2 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {meal.name}
              {meal.suggested_time && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="size-3" />
                  {meal.suggested_time.slice(0, 5)}
                </Badge>
              )}
              {collapsed && collapsible.status}
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition-transform", !collapsed && "rotate-180")}
              />
            </button>
          ) : (
            <>
              {meal.name}
              {meal.suggested_time && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="size-3" />
                  {meal.suggested_time.slice(0, 5)}
                </Badge>
              )}
            </>
          )}
        </CardTitle>
        {!editable && headerAction && <CardAction className="self-center">{headerAction}</CardAction>}
        {editable && (
          <CardAction className={CARD_ACTIONS_CLASS}>
            {singleOption && (
              <AddMealItemDialog
                studentId={studentId}
                mealOptionId={singleOption.id}
                groups={existingGroups(singleOption.meal_items)}
              />
            )}
            <AddMealOptionDialog studentId={studentId} mealId={meal.id} />
            <EditMealDialog
              studentId={studentId}
              mealId={meal.id}
              name={meal.name}
              suggestedTime={meal.suggested_time}
            />
            <ConfirmDeleteButton
              confirmMessage={`Remover a refeição "${meal.name}" e todos os seus itens?`}
              action={() => deleteMeal(studentId, meal.id)}
            />
          </CardAction>
        )}
      </CardHeader>
      {!collapsed && (
        <CardContent
          id={`meal-body-${meal.id}`}
          className={showOptionLabels ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}
        >
          {meal.meal_options.map((option, index) => (
            <div key={option.id} className={showOptionLabels ? "flex flex-col gap-2" : "contents"}>
              {showOptionLabels && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{option.label || `Opção ${index + 1}`}</p>
                  {editable && (
                    <div className="flex items-center gap-1">
                      <AddMealItemDialog
                        studentId={studentId}
                        mealOptionId={option.id}
                        groups={existingGroups(option.meal_items)}
                      />
                      <EditMealOptionDialog studentId={studentId} mealOptionId={option.id} label={option.label} />
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
                groupMealItems(option.meal_items).map((block) => {
                  const groups = existingGroups(option.meal_items);
                  const renderItem = (item: MealItem) => (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {item.food_name}{" "}
                          <span className="text-sm text-muted-foreground">
                            — {formatQuantity(item.quantity, item.unit)}
                          </span>
                        </p>
                        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                      </div>
                      {editable && (
                        <div className="flex shrink-0 items-center gap-1">
                          <EditMealItemDialog studentId={studentId} item={item} groups={groups} />
                          <ConfirmDeleteButton
                            confirmMessage={`Remover "${item.food_name}"?`}
                            action={() => deleteMealItem(studentId, item.id)}
                          />
                        </div>
                      )}
                    </div>
                  );

                  if (block.kind === "single") {
                    return <div key={block.item.id}>{renderItem(block.item)}</div>;
                  }
                  return (
                    <ChoiceCarousel
                      key={block.items[0].id}
                      label={block.label}
                      slides={block.items.map((item) => ({
                        key: item.id,
                        name: item.food_name,
                        content: renderItem(item),
                      }))}
                    />
                  );
                })
              )}
            </div>
          ))}
        </CardContent>
      )}
      {tracking && <div className="border-t border-border px-4 pt-4">{tracking}</div>}
    </Card>
  );
}
