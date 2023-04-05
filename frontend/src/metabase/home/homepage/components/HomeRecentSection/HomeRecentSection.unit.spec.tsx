import React from "react";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { createMockRecentItem, createMockUser } from "metabase-types/api/mocks";
import { renderWithProviders } from "__support__/ui";
import { setupRecentViewsEndpoints } from "__support__/server-mocks";
import { User } from "metabase-types/api";
import HomeRecentSection from "./HomeRecentSection";

interface SetupOpts {
  currentUser?: User;
}

const setup = async ({ currentUser }: SetupOpts = {}) => {
  setupRecentViewsEndpoints([
    createMockRecentItem({
      model: "table",
      model_object: {
        name: "Orders",
      },
    }),
  ]);

  renderWithProviders(<HomeRecentSection />, {
    storeInitialState: { currentUser },
  });

  await waitForElementToBeRemoved(() => screen.queryByText("Loading..."));
};

describe("HomeRecentSection", () => {
  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date(2020, 0, 20),
      advanceTimers: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("new installers", () => {
    it("should show a help link for new installers", async () => {
      await setup({
        currentUser: createMockUser({
          is_installer: true,
          first_login: "2020-01-20T00:00:00Z",
        }),
      });

      expect(await screen.findByText("Metabase tips")).toBeInTheDocument();
    });

    it("should not show a help link for regular users", async () => {
      await setup({
        currentUser: createMockUser({
          is_installer: true,
          first_login: "2020-01-01T00:00:00Z",
        }),
      });

      expect(screen.queryByText("Metabase tips")).not.toBeInTheDocument();
    });
  });

  it("should render a list of recent items", async () => {
    await setup();

    expect(screen.getByText("Pick up where you left off")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });
});
