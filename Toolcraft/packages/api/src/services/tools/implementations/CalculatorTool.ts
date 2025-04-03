// packages/api/src/services/tools/implementations/CalculatorTool.ts

import { Tool } from "@toolcraft/shared";
import { evaluate } from "mathjs";

export class CalculatorTool implements Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;

  constructor() {
    this.name = "calculator";
    this.description = "Perform mathematical calculations";
    this.parameters = {
      expression: {
        type: "string",
        description:
          'The mathematical expression to evaluate (e.g., "2 + 2", "sin(45 deg)", "5 * 9", "sqrt(16)")',
        required: true,
      },
    };
  }

  async execute(parameters: Record<string, any>): Promise<any> {
    const expression = parameters.expression;

    try {
      // Use mathjs to safely evaluate the expression
      const result = evaluate(expression);

      return {
        success: true,
        result,
        message: `${expression} = ${result}`,
      };
    } catch (error) {
      console.error("Error executing calculator tool:", error);

      return {
        success: false,
        error: error,
        message: `Failed to evaluate expression: "${expression}"`,
      };
    }
  }
}

/*

curl -X POST http://localhost:3001/api/agent/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-afb14ba6-be16-4f29-bb50-9de911b69503",
    "conversationId":"conv-39c618db-3845-433b-8686-913e74c15821",
    "content":"Hello who are you?"
  }'

curl -X POST http://localhost:3001/api/conversation \      
  -H "Content-Type: application/json" \
  -d '{"userId":"user-afb14ba6-be16-4f29-bb50-9de911b69503","title":"Test Conversation"}



*/