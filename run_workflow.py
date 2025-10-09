# Agent SDK - RUN's AI Agent Workflow
from pydantic import BaseModel
from agents import Agent, ModelSettings, TResponseInputItem, Runner, RunConfig
from openai.types.shared.reasoning import Reasoning

class WebResearchAgentSchema__EndeavorDetails(BaseModel):
  statement: str
  field_of_work: str
  keywords: list[str]


class WebResearchAgentSchema__EvidenceOfMerit(BaseModel):
  summary: str


class WebResearchAgentSchema__Prong1NationalImportanceAndMerit(BaseModel):
  potential_impact_areas: list[str]
  evidence_of_merit: WebResearchAgentSchema__EvidenceOfMerit


class WebResearchAgentSchema__Prong2ApplicantPositioningSummary(BaseModel):
  summary: str


class WebResearchAgentSchema__QuantifiableBenefitsToUs(BaseModel):
  publications_total: float
  citation_count: float
  patents_filed: float
  awards_won: float


class WebResearchAgentSchema__Prong3BenefitOfWaiverFactors(BaseModel):
  urgency_and_impracticality_of_labor_certification: str
  quantifiable_benefits_to_us: WebResearchAgentSchema__QuantifiableBenefitsToUs
  applicant_potential_vs_average_practitioner: str


class WebResearchAgentSchema(BaseModel):
  endeavor_details: WebResearchAgentSchema__EndeavorDetails
  prong_1_national_importance_and_merit: WebResearchAgentSchema__Prong1NationalImportanceAndMerit
  prong_2_applicant_positioning_summary: WebResearchAgentSchema__Prong2ApplicantPositioningSummary
  prong_3_benefit_of_waiver_factors: WebResearchAgentSchema__Prong3BenefitOfWaiverFactors


class SummarizeAndDisplaySchema__PathwaysItem(BaseModel):
  id: str
  label: str
  icon: str
  status: str
  badgeColor: str
  summary: str


class SummarizeAndDisplaySchema(BaseModel):
  title: str
  pathways: list[SummarizeAndDisplaySchema__PathwaysItem]
  strengthsCount: float
  weaknessesCount: float
  designSpec: str
  complexityBudget: str


web_research_agent = Agent(
  name="Web research agent",
  instructions="""You are an NIW petition reviewer. The user will give you two json files with the information regarding their profile and proposed endeavors.  You will be researching the merit, their well positionedness based on the two input JSON strings as text.
""",
  model="gpt-5-mini",
  output_type=WebResearchAgentSchema,
  model_settings=ModelSettings(
    store=True,
    reasoning=Reasoning(
      effort="medium",
      summary="auto"
    )
  )
)


summarize_and_display = Agent(
  name="Summarize and display",
  instructions="""Put the research together in a nice display using the output format described.
""",
  model="gpt-5",
  output_type=SummarizeAndDisplaySchema,
  model_settings=ModelSettings(
    store=True,
    reasoning=Reasoning(
      effort="minimal",
      summary="auto"
    )
  )
)


class WorkflowInput(BaseModel):
  input_as_text: str


# Main code entrypoint
async def run_workflow(workflow_input: WorkflowInput):
  state = {

  }
  workflow = workflow_input.model_dump()
  conversation_history: list[TResponseInputItem] = [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": workflow["input_as_text"]
        }
      ]
    }
  ]
  web_research_agent_result_temp = await Runner.run(
    web_research_agent,
    input=[
      *conversation_history
    ],
    run_config=RunConfig(trace_metadata={
      "__trace_source__": "agent-builder",
      "workflow_id": "wf_68e77e35455c8190a373fab7ffd990cc01da834973afc862"
    })
  )

  conversation_history.extend([item.to_input_item() for item in web_research_agent_result_temp.new_items])

  web_research_agent_result = {
    "output_text": web_research_agent_result_temp.final_output.json(),
    "output_parsed": web_research_agent_result_temp.final_output.model_dump()
  }
  summarize_and_display_result_temp = await Runner.run(
    summarize_and_display,
    input=[
      *conversation_history
    ],
    run_config=RunConfig(trace_metadata={
      "__trace_source__": "agent-builder",
      "workflow_id": "wf_68e77e35455c8190a373fab7ffd990cc01da834973afc862"
    })
  )
  summarize_and_display_result = {
    "output_text": summarize_and_display_result_temp.final_output.json(),
    "output_parsed": summarize_and_display_result_temp.final_output.model_dump()
  }
