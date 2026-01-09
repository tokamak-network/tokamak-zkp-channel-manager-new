/**
 * DB Test API Route
 * 
 * Tests database operations (CRUD)
 */

import { NextResponse } from "next/server";
import {
  saveChannel,
  getChannel,
  updateChannel,
  getAllChannels,
  deleteChannel,
} from "@/lib/db";

/**
 * POST /api/db/test - Test database operations
 */
export async function POST() {
  try {
    const testResults: string[] = [];
    const testChannelId = `test-${Date.now()}`;

    // Test 1: Save channel
    try {
      await saveChannel(testChannelId, {
        channelId: testChannelId,
        status: "test",
        targetContract: "0x0000000000000000000000000000000000000000",
        participants: ["0x1111111111111111111111111111111111111111"],
        createdAt: new Date().toISOString(),
      });
      testResults.push("✅ Test 1: Save channel - PASSED");
    } catch (error) {
      testResults.push(
        `❌ Test 1: Save channel - FAILED: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 2: Get channel
    try {
      const channel = await getChannel(testChannelId);
      if (channel && channel.channelId === testChannelId) {
        testResults.push("✅ Test 2: Get channel - PASSED");
      } else {
        testResults.push("❌ Test 2: Get channel - FAILED: Channel not found");
      }
    } catch (error) {
      testResults.push(
        `❌ Test 2: Get channel - FAILED: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 3: Update channel
    try {
      await updateChannel(testChannelId, {
        status: "updated",
      });
      const updatedChannel = await getChannel(testChannelId);
      if (updatedChannel && updatedChannel.status === "updated") {
        testResults.push("✅ Test 3: Update channel - PASSED");
      } else {
        testResults.push("❌ Test 3: Update channel - FAILED: Update not reflected");
      }
    } catch (error) {
      testResults.push(
        `❌ Test 3: Update channel - FAILED: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 4: Get all channels
    try {
      const channels = await getAllChannels();
      if (Array.isArray(channels)) {
        testResults.push(`✅ Test 4: Get all channels - PASSED (found ${channels.length} channels)`);
      } else {
        testResults.push("❌ Test 4: Get all channels - FAILED: Invalid response");
      }
    } catch (error) {
      testResults.push(
        `❌ Test 4: Get all channels - FAILED: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 5: Delete channel
    try {
      await deleteChannel(testChannelId);
      const deletedChannel = await getChannel(testChannelId);
      if (!deletedChannel) {
        testResults.push("✅ Test 5: Delete channel - PASSED");
      } else {
        testResults.push("❌ Test 5: Delete channel - FAILED: Channel still exists");
      }
    } catch (error) {
      testResults.push(
        `❌ Test 5: Delete channel - FAILED: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return NextResponse.json({
      success: true,
      results: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter((r) => r.startsWith("✅")).length,
        failed: testResults.filter((r) => r.startsWith("❌")).length,
      },
    });
  } catch (error) {
    console.error("DB test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run DB tests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
